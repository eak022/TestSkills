import Elysia, { t } from 'elysia'
import { BotCommandType } from '@prisma/index'
import { BotAuthGuard } from '@/libs/guards/bot.guard'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { BEARER_SECURITY, BOT_KEY_SECURITY } from '@/libs/docs/security'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { actorLabel } from '@/libs/utils/order-access.util'
import { AuditLogRepository } from '@/repositories/audit-log.repository'
import { BotAgentRepository } from '@/repositories/bot-agent.repository'
import { BotCommandRepository } from '@/repositories/bot-command.repository'
import { SystemSettingRepository } from '@/repositories/system-setting.repository'
import { BotService } from './bot.service'
import { CodePackageService } from './code-package.service'
import { KillSwitchService } from './kill-switch.service'

function createBotService () {
  return new BotService(
    new BotAgentRepository(),
    new BotCommandRepository(),
    new AuditLogRepository(),
    new KillSwitchService(new SystemSettingRepository())
  )
}

const botIdParams = t.Object({
  botId: t.String({ example: 'bot-01' })
})

// ฝั่งบอท: ยืนยันด้วย x-bot-key
export const BotAgentHttpController = new Elysia({ name: 'BotAgentHttpController' })
  .use(BotAuthGuard)
  .post('/heartbeat', async ({ body, bot }) => {
    return await createBotService().heartbeat(bot.id, body)
  }, {
    botAuth: true,
    body: t.Object({
      cpuPercent: t.Optional(t.Number()),
      memoryPercent: t.Optional(t.Number()),
      uptimeSeconds: t.Optional(t.Number())
    }),
    detail: {
      summary: 'Bot heartbeat (bot)',
      description: 'เฉพาะบอท (x-bot-key) — ยิงเป็นระยะ เงียบเกินเวลาจะถูกตัด offline และออเดอร์ที่ถืออยู่หลุด lease คำตอบมี killSwitch กับ acceptingOrders บอทใน oxide-monitor-candidate-pack หยุดรับงานเมื่อ kill-switch เปิดหรือถูกสั่ง stop',
      security: BOT_KEY_SECURITY
    }
  })

// ฝั่งแอดมิน: JWT + role ADMIN
export const BotHttpController = new Elysia({ name: 'BotHttpController' })
  .use(UserAuthGuard)
  .get('/summary', async () => {
    return await createBotService().summary()
  }, {
    adminAuth: true,
    detail: {
      summary: 'Bot overview summary (admin)',
      description: 'Online / Active / Standby / In Progress — sync จาก simulator อย่างน้อย 3 เครื่อง',
      security: BEARER_SECURITY
    }
  })
  .get('/', async () => {
    return await createBotService().list()
  }, {
    adminAuth: true,
    detail: {
      summary: 'List bot instances (admin)',
      description: 'การ์ดต่อเครื่อง: heartbeat, work state, งานล่าสุด Done/Failed',
      security: BEARER_SECURITY
    }
  })
  .post('/', async ({ body, user }) => {
    return await createBotService().register(body, actorLabel(user))
  }, {
    adminAuth: true,
    body: t.Object({
      id: t.String({ minLength: 1, example: 'bot-04' }),
      name: t.String({ minLength: 1, example: 'Midasbuy Bot 04' }),
      deviceName: t.String({ minLength: 1, example: 'PC-04' })
    }),
    detail: {
      summary: 'Register bot + issue key (admin)',
      description: 'ลงทะเบียนเครื่องใหม่ คืน apiKey ครั้งเดียว (DB เก็บแค่ hash) — นำไปตั้งเป็น x-bot-key ที่เครื่องบอท',
      security: BEARER_SECURITY
    }
  })
  .post('/update', async ({ body, user }) => {
    return await createBotService().updateCode(body.version, body.botId, actorLabel(user))
  }, {
    adminAuth: true,
    body: t.Object({
      version: t.String({ example: '1.0.1', description: 'เลขเวอร์ชันที่ตั้งบนเครื่อง เช่น 1.0.1' }),
      botId: t.Optional(t.String({ example: 'bot-01', description: 'ได้จาก GET /bots → id ไม่ส่ง = อัปเดตทุกเครื่อง' }))
    }),
    detail: {
      summary: 'Push code update (admin)',
      description: 'แอดมินตั้งเลขเวอร์ชันแล้วส่งคำสั่ง update ไปทุกเครื่องหรือรายเครื่อง ไม่ได้รับไฟล์',
      security: BEARER_SECURITY
    }
  })
  .get('/packages/latest', async () => {
    const codePackage = await new CodePackageService(new SystemSettingRepository()).latest()
    return { package: codePackage }
  }, {
    adminAuth: true,
    detail: {
      summary: 'Latest bot code package (admin)',
      description: 'แอดมินดูแพ็กเกจ zip ล่าสุดที่เก็บไว้ ถ้ายังไม่เคยอัปโหลด package เป็น null',
      security: BEARER_SECURITY
    }
  })
  .post('/packages', async ({ body, user }) => {
    const version = body.version?.trim()
    if (!version) throw new BadRequestError('ต้องใส่เวอร์ชัน')
    const botId = body.botId?.trim() || undefined
    const actor = actorLabel(user)
    const codePackage = await new CodePackageService(new SystemSettingRepository()).store(body.file, version, actor)
    const update = await createBotService().updateCode(version, botId, actor)
    return { package: codePackage, ...update }
  }, {
    adminAuth: true,
    body: t.Object({
      file: t.File({
        description: 'ไฟล์ .zip ที่แอดมินสร้างเอง สูงสุด 20MB เซิร์ฟเวอร์เก็บไฟล์อย่างเดียว ไม่แตกและไม่รัน'
      }),
      version: t.String({ example: '1.0.1', description: 'เลขเวอร์ชันที่ตั้งบนเครื่อง เช่น 1.0.1' }),
      botId: t.Optional(t.String({
        example: 'bot-01',
        description: 'ได้จาก GET /bots → id ไม่ส่ง = อัปเดตทุกเครื่อง'
      }))
    }),
    detail: {
      summary: 'Upload bot code zip (admin)',
      description: 'แอดมินอัปโหลด zip แล้วระบบเก็บไฟล์ไว้ใน data/bot-packages โดยไม่รันบนเซิร์ฟเวอร์กลาง จากนั้นส่งคำสั่ง update ไปทุกเครื่องหรือเฉพาะ botId',
      security: BEARER_SECURITY
    }
  })
  .get('/:botId/logs', async ({ params }) => {
    return await createBotService().logs(params.botId)
  }, {
    adminAuth: true,
    params: botIdParams,
    detail: {
      summary: 'Bot command logs (admin)',
      description: 'แอดมินดูคำสั่งล่าสุดของเครื่องนี้ ได้ botId จาก GET /bots → id',
      security: BEARER_SECURITY
    }
  })
  .post('/:botId/commands', async ({ params, body, user }) => {
    return await createBotService().command(params.botId, body.command, actorLabel(user))
  }, {
    adminAuth: true,
    params: botIdParams,
    body: t.Object({
      command: t.Enum(BotCommandType)
    }),
    detail: {
      summary: 'Send bot command (admin)',
      description: 'start / stop / restart / status / update — forward ไป simulator และบันทึก audit (ผู้สั่งมาจาก token)',
      security: BEARER_SECURITY
    }
  })
  .post('/:botId/api-key', async ({ params, user }) => {
    return await createBotService().issueApiKey(params.botId, actorLabel(user))
  }, {
    adminAuth: true,
    params: botIdParams,
    detail: {
      summary: 'Issue / rotate bot key (admin)',
      description: 'ออกคีย์ใหม่ให้เครื่องนี้ คืนครั้งเดียว คีย์เก่าใช้ไม่ได้ทันที',
      security: BEARER_SECURITY
    }
  })
  .delete('/:botId/api-key', async ({ params, user }) => {
    return await createBotService().revokeApiKey(params.botId, actorLabel(user))
  }, {
    adminAuth: true,
    params: botIdParams,
    detail: {
      summary: 'Revoke bot key (admin)',
      description: 'เพิกถอนคีย์ — เครื่องนี้เรียก claim/heartbeat/fulfill ไม่ได้อีก',
      security: BEARER_SECURITY
    }
  })

export const KillSwitchHttpController = new Elysia({ name: 'KillSwitchHttpController' })
  .use(UserAuthGuard)
  .get('/kill-switch', async () => {
    const enabled = await new KillSwitchService(new SystemSettingRepository()).isEnabled()
    return { enabled }
  }, {
    adminAuth: true,
    detail: {
      summary: 'Get global kill-switch (admin)',
      description: 'ถ้าเปิด บอททุกเครื่องปฏิเสธรับออเดอร์ใหม่',
      security: BEARER_SECURITY
    }
  })
  .post('/kill-switch', async ({ body, user }) => {
    const actor = actorLabel(user)
    const result = await new KillSwitchService(new SystemSettingRepository()).setEnabled(body.enabled, actor)
    await new AuditLogRepository().create({
      data: {
        actor,
        action: body.enabled ? 'kill_switch.on' : 'kill_switch.off',
        targetType: 'system',
        targetId: 'killSwitch',
        metadata: result
      }
    })
    return result
  }, {
    adminAuth: true,
    body: t.Object({
      enabled: t.Boolean()
    }),
    detail: {
      summary: 'Set global kill-switch (admin)',
      security: BEARER_SECURITY
    }
  })
