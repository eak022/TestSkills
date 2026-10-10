import { NotFoundError } from 'elysia'
import { ConflictError } from '@/libs/middlewares/error-handler/domain'
import { generateBotApiKey, hashApiKey } from '@/libs/utils/api-key.util'
import { type AuditLogRepository } from '@/repositories/audit-log.repository'
import { type BotAgentRepository } from '@/repositories/bot-agent.repository'
import { type BotCommandRepository } from '@/repositories/bot-command.repository'
import { BotAgentStatus, BotCommandType, BotWorkState, type Prisma } from '@prisma/index'
import { type KillSwitchService } from './kill-switch.service'

const SIMULATOR_URL = process.env.BOT_SIMULATOR_URL || 'http://localhost:8788'

type SimulatorBot = {
  id: string
  name: string
  deviceName: string
  status: string
  cpuPercent: number
  memoryPercent: number
  uptimeSeconds: number
}

function commandMessage (result: Prisma.JsonValue | null | undefined) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return ''
  const record = result as { error?: unknown, ok?: unknown }
  if (typeof record.error === 'string') return record.error.slice(0, 180)
  if (record.ok === true) return 'ok'
  return ''
}

function mapStatus (status: string): BotAgentStatus {
  if (status === 'online' || status === 'offline' || status === 'starting' || status === 'stopping' || status === 'error') {
    return status
  }
  return BotAgentStatus.offline
}

export class BotService {
  constructor (
    private readonly botAgentRepository: BotAgentRepository,
    private readonly botCommandRepository: BotCommandRepository,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly killSwitchService: KillSwitchService
  ) {}

  async syncFromSimulator (): Promise<void> {
    try {
      const response = await fetch(`${SIMULATOR_URL}/bots`)
      if (!response.ok) return
      const bots = await response.json() as SimulatorBot[]
      for (const bot of bots) {
        await this.botAgentRepository.upsert({
          where: { id: bot.id },
          create: {
            id: bot.id,
            name: bot.name,
            deviceName: bot.deviceName,
            status: mapStatus(bot.status),
            workState: mapStatus(bot.status) === BotAgentStatus.online ? 'standby' : 'stopped',
            cpuPercent: bot.cpuPercent,
            memoryPercent: bot.memoryPercent,
            uptimeSeconds: BigInt(bot.uptimeSeconds ?? 0),
            lastHeartbeat: mapStatus(bot.status) === BotAgentStatus.online ? new Date() : null
          },
          update: {
            name: bot.name,
            deviceName: bot.deviceName,
            status: mapStatus(bot.status),
            cpuPercent: bot.cpuPercent,
            memoryPercent: bot.memoryPercent,
            uptimeSeconds: BigInt(bot.uptimeSeconds ?? 0)
          }
        })
      }
    } catch (error) {
      console.log(JSON.stringify({ message: 'simulator_unreachable', error: String(error) }))
    }
  }

  async list () {
    await this.syncFromSimulator()
    const bots = await this.botAgentRepository.findMany({
      orderBy: { id: 'asc' },
      include: {
        commands: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
    return bots.map((bot) => this.mapBot(bot))
  }

  async summary () {
    const bots = await this.list()
    const killSwitch = await this.killSwitchService.isEnabled()
    return {
      killSwitch,
      onlineCount: bots.filter((bot) => bot.status === 'online').length,
      active: bots.filter((bot) => bot.status === 'online' && bot.workState !== 'stopped').length,
      standby: bots.filter((bot) => bot.workState === 'standby').length,
      inProgress: bots.filter((bot) => bot.workState === 'in_progress').length,
      bots
    }
  }

  // botId มาจากคีย์ที่ยืนยันแล้ว — ไม่สร้างบอทอัตโนมัติ และไม่ทับ workState ที่กำลังทำงานอยู่
  async heartbeat (botId: string, body: {
    cpuPercent?: number
    memoryPercent?: number
    uptimeSeconds?: number
  }) {
    const bot = await this.botAgentRepository.findUnique({ where: { id: botId } })
    if (!bot) {
      throw new NotFoundError(`ไม่พบบอท ${botId}`)
    }
    const stopped = bot.workState === BotWorkState.stopped
    const killSwitch = await this.killSwitchService.isEnabled()
    await this.botAgentRepository.update({
      where: { id: botId },
      data: {
        status: stopped ? BotAgentStatus.offline : BotAgentStatus.online,
        lastHeartbeat: new Date(),
        cpuPercent: body.cpuPercent ?? 0,
        memoryPercent: body.memoryPercent ?? 0,
        uptimeSeconds: BigInt(body.uptimeSeconds ?? 0)
      }
    })
    return { ok: true, killSwitch, acceptingOrders: !stopped && !killSwitch }
  }

  // ลงทะเบียนเครื่องใหม่ + ออกคีย์ (แสดงครั้งเดียว)
  async register (body: { id: string, name: string, deviceName: string }, actor: string) {
    const existing = await this.botAgentRepository.findUnique({ where: { id: body.id } })
    if (existing) {
      throw new ConflictError(`บอท ${body.id} มีอยู่แล้ว`)
    }
    const apiKey = generateBotApiKey()
    await this.botAgentRepository.create({
      data: {
        id: body.id,
        name: body.name,
        deviceName: body.deviceName,
        apiKeyHash: hashApiKey(apiKey)
      }
    })
    await this.audit(actor, 'bot.register', body.id)
    return { botId: body.id, apiKey }
  }

  // ออก/หมุนคีย์ — คีย์เก่าใช้ไม่ได้ทันที
  async issueApiKey (botId: string, actor: string) {
    await this.ensureBot(botId)
    const apiKey = generateBotApiKey()
    await this.botAgentRepository.update({
      where: { id: botId },
      data: { apiKeyHash: hashApiKey(apiKey) }
    })
    await this.audit(actor, 'bot.api_key.issue', botId)
    return { botId, apiKey }
  }

  async revokeApiKey (botId: string, actor: string) {
    await this.ensureBot(botId)
    await this.botAgentRepository.update({
      where: { id: botId },
      data: { apiKeyHash: null }
    })
    await this.audit(actor, 'bot.api_key.revoke', botId)
    return { botId, revoked: true }
  }

  private async audit (actor: string, action: string, botId: string) {
    await this.auditLogRepository.create({
      data: { actor, action, targetType: 'bot', targetId: botId }
    })
  }

  async command (botId: string, command: BotCommandType, requestedBy: string) {
    if (await this.killSwitchService.isEnabled() && (command === BotCommandType.start || command === BotCommandType.restart)) {
      throw new ConflictError('Kill-switch เปิดอยู่ ห้าม start/restart')
    }

    const bot = await this.ensureBot(botId)
    const created = await this.botCommandRepository.create({
      data: {
        botId: bot.id,
        command,
        requestedBy,
        status: 'running'
      }
    })

    let result: Prisma.InputJsonValue = { ok: false }
    let status: 'success' | 'failed' = 'failed'
    try {
      const response = await fetch(`${SIMULATOR_URL}/bots/${botId}/commands`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ command: command === BotCommandType.update ? 'restart' : command })
      })
      result = await response.json() as Prisma.InputJsonValue
      status = response.ok ? 'success' : 'failed'
    } catch (error) {
      result = { error: String(error) }
    }

    await this.botCommandRepository.update({
      where: { id: created.id },
      data: { status, result, completedAt: new Date() }
    })

    if (command === BotCommandType.stop) {
      await this.botAgentRepository.update({
        where: { id: botId },
        data: { workState: 'stopped', status: BotAgentStatus.offline }
      })
    }
    if (command === BotCommandType.start || command === BotCommandType.restart) {
      await this.botAgentRepository.update({
        where: { id: botId },
        data: { workState: 'standby', status: BotAgentStatus.online, lastHeartbeat: new Date() }
      })
    }

    await this.auditLogRepository.create({
      data: {
        actor: requestedBy,
        action: `bot.${command}`,
        targetType: 'bot',
        targetId: botId,
        metadata: result
      }
    })

    return { botId, command, status, result }
  }

  async logs (botId: string) {
    await this.ensureBot(botId)
    const commands = await this.botCommandRepository.findMany({
      where: { botId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    return {
      botId,
      logs: commands.map((command) => ({
        at: command.createdAt,
        command: command.command,
        status: command.status,
        actor: command.requestedBy,
        message: commandMessage(command.result)
      }))
    }
  }

  async updateCode (version: string, botId: string | undefined, requestedBy: string) {
    const bots = botId
      ? [await this.ensureBot(botId)]
      : await this.botAgentRepository.findMany({})

    const results = []
    for (const bot of bots) {
      await this.botAgentRepository.update({
        where: { id: bot.id },
        data: { codeVersion: version }
      })
      results.push(await this.command(bot.id, BotCommandType.update, requestedBy))
    }
    return { version, results }
  }

  private async ensureBot (botId: string) {
    await this.syncFromSimulator()
    const bot = await this.botAgentRepository.findUnique({ where: { id: botId } })
    if (!bot) {
      throw new NotFoundError(`ไม่พบบอท ${botId}`)
    }
    return bot
  }

  private mapBot (bot: {
    id: string
    name: string
    deviceName: string
    status: BotAgentStatus
    workState: string
    cpuPercent: { toString: () => string }
    memoryPercent: { toString: () => string }
    uptimeSeconds: bigint
    lastHeartbeat: Date | null
    codeVersion: string | null
    lastJobResult: string | null
    updatedAt: Date
  }) {
    return {
      id: bot.id,
      name: bot.name,
      deviceName: bot.deviceName,
      status: bot.status,
      workState: bot.workState,
      heartbeat: bot.lastHeartbeat,
      cpuPercent: Number(bot.cpuPercent.toString()),
      memoryPercent: Number(bot.memoryPercent.toString()),
      uptimeSeconds: Number(bot.uptimeSeconds),
      codeVersion: bot.codeVersion,
      lastJobResult: bot.lastJobResult,
      updatedAt: bot.updatedAt
    }
  }
}
