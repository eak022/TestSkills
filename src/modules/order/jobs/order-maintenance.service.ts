import { logOrder } from '@/libs/utils/order-logger.util'
import { BOT_HEARTBEAT_TTL_MS, decideStaleClaim, retryBackoffMs } from '@/libs/utils/order-ops.util'
import { transitionOrder } from '@/modules/order/order-transition'
import { type BotAgentRepository } from '@/repositories/bot-agent.repository'
import { type OrderRepository } from '@/repositories/order.repository'
import { type OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { type SystemAlertRepository } from '@/repositories/system-alert.repository'
import { OrderStatus, prisma } from '@prisma/index'
import { QUEUED_SLA_MS } from '@/libs/utils/order-ops.util'

export class OrderMaintenanceService {
  constructor (
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: OrderTimelineRepository,
    private readonly systemAlertRepository: SystemAlertRepository,
    private readonly botAgentRepository: BotAgentRepository
  ) {}

  async run (): Promise<{ expired: number, reclaimed: number, alerts: number, silentBots: number }> {
    const expired = await this.expirePendingPayments()
    const reclaimed = await this.reclaimStaleLeases()
    const alerts = await this.alertQueuedOverSla()
    const silentBots = await this.markSilentBots()
    return { expired, reclaimed, alerts, silentBots }
  }

  private async expirePendingPayments (): Promise<number> {
    const due = await this.orderRepository.findMany({
      where: {
        deletedAt: null,
        status: OrderStatus.PENDING_PAYMENT,
        expiresAt: { lte: new Date() }
      }
    })

    for (const order of due) {
      await prisma.$transaction(async (tx) => {
        const fresh = await this.orderRepository.findFirst({
          where: { id: order.id, status: OrderStatus.PENDING_PAYMENT }
        }, tx)
        if (!fresh) return
        await transitionOrder(
          this.orderRepository,
          this.timelineRepository,
          tx,
          fresh,
          OrderStatus.EXPIRED,
          'PENDING_PAYMENT exceeded QR/payment TTL'
        )
      })
    }
    return due.length
  }

  private async reclaimStaleLeases (): Promise<number> {
    const stale = await this.orderRepository.findMany({
      where: {
        deletedAt: null,
        status: OrderStatus.IN_PROGRESS,
        leaseExpiresAt: { lte: new Date() }
      }
    })

    for (const order of stale) {
      await prisma.$transaction(async (tx) => {
        const fresh = await this.orderRepository.findFirst({
          where: { id: order.id, status: OrderStatus.IN_PROGRESS }
        }, tx)
        if (!fresh) return
        const decision = decideStaleClaim(fresh.retryCount)
        const backoffUntil = new Date(Date.now() + retryBackoffMs(decision.retryCount))
        await transitionOrder(
          this.orderRepository,
          this.timelineRepository,
          tx,
          fresh,
          decision.nextStatus,
          decision.alertAdmin
            ? `Lease expired after ${fresh.retryCount} retries — DELAYED, notify admin`
            : `Lease expired, requeue retry ${decision.retryCount}`,
          {
            claimedBy: null,
            claimedAt: null,
            lastHeartbeatAt: null,
            leaseExpiresAt: decision.nextStatus === OrderStatus.QUEUED ? backoffUntil : null,
            retryCount: decision.retryCount
          }
        )
      })
      if (decideStaleClaim(order.retryCount).alertAdmin) {
        try {
          await this.systemAlertRepository.create({
            data: {
              type: 'CLAIM_EXHAUSTED',
              orderNo: order.orderNo,
              message: `Order ${order.orderNo} delayed after ${order.retryCount} silent-bot retries`
            }
          })
        } catch {
          // already alerted
        }
      }
    }
    return stale.length
  }

  private async alertQueuedOverSla (): Promise<number> {
    const cutoff = new Date(Date.now() - QUEUED_SLA_MS)
    const overdue = await this.orderRepository.findMany({
      where: {
        deletedAt: null,
        status: OrderStatus.QUEUED,
        updatedAt: { lte: cutoff }
      }
    })

    let alerts = 0
    for (const order of overdue) {
      try {
        await this.systemAlertRepository.create({
          data: {
            type: 'QUEUED_SLA',
            orderNo: order.orderNo,
            message: `Order ${order.orderNo} queued longer than SLA`
          }
        })
        logOrder(order.orderNo, 'queued_sla_alert')
        alerts += 1
      } catch {
        // unique (type, orderNo) makes this job idempotent
      }
    }
    return alerts
  }

  private async markSilentBots (): Promise<number> {
    const cutoff = new Date(Date.now() - BOT_HEARTBEAT_TTL_MS)
    const silent = await this.botAgentRepository.findMany({
      where: {
        status: 'online',
        OR: [
          { lastHeartbeat: null },
          { lastHeartbeat: { lte: cutoff } }
        ]
      }
    })

    for (const bot of silent) {
      await this.botAgentRepository.update({
        where: { id: bot.id },
        data: { status: 'offline', workState: 'stopped' }
      })
      const held = await this.orderRepository.findMany({
        where: {
          deletedAt: null,
          status: OrderStatus.IN_PROGRESS,
          claimedBy: bot.id
        }
      })
      for (const order of held) {
        await this.orderRepository.update({
          where: { id: order.id },
          data: { leaseExpiresAt: new Date() }
        })
        logOrder(order.orderNo, 'bot_silent_force_expire_lease', { botId: bot.id })
      }
    }
    return silent.length
  }
}
