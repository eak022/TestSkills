import { ConflictError } from '@/libs/middlewares/error-handler/domain'
import { logOrder } from '@/libs/utils/order-logger.util'
import { LEASE_MS } from '@/libs/utils/order-ops.util'
import { mapOrder, orderDetailSelect } from '@/modules/order/order.mapper'
import { type KillSwitchService } from '@/modules/bot/kill-switch.service'
import { type BotAgentRepository } from '@/repositories/bot-agent.repository'
import { type OrderRepository } from '@/repositories/order.repository'
import { type OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { BotAgentStatus, BotWorkState, OrderStatus, prisma } from '@prisma/index'
import { type ClaimOrderModel } from './claim.model'

export class ClaimOrderService {
  constructor (
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: OrderTimelineRepository,
    private readonly botAgentRepository: BotAgentRepository,
    private readonly killSwitchService: KillSwitchService
  ) {}

  async execute (botId: string): Promise<ClaimOrderModel.response> {
    if (await this.killSwitchService.isEnabled()) {
      throw new ConflictError('Kill-switch เปิดอยู่ บอทห้ามรับงานใหม่')
    }

    const claimed = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: number }[]>`
        SELECT id FROM "order"
        WHERE "deletedAt" IS NULL
          AND "status" = 'QUEUED'::"OrderStatus"
          AND ("leaseExpiresAt" IS NULL OR "leaseExpiresAt" < NOW())
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `
      const row = rows[0]
      if (!row) return null

      const order = await this.orderRepository.findFirst({
        where: { id: row.id }
      }, tx)
      if (!order) return null

      const now = new Date()
      const saved = await this.orderRepository.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.IN_PROGRESS,
          version: { increment: 1 },
          claimedBy: botId,
          claimedAt: now,
          lastHeartbeatAt: now,
          leaseExpiresAt: new Date(now.getTime() + LEASE_MS)
        },
        select: orderDetailSelect
      }, tx)

      await this.timelineRepository.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: OrderStatus.IN_PROGRESS,
          reason: `Claimed by ${botId}`
        }
      }, tx)

      // การ์ดบอท/summary ต้องเห็นว่าเครื่องนี้กำลังทำงาน
      await this.botAgentRepository.updateMany({
        where: { id: botId },
        data: {
          workState: BotWorkState.in_progress,
          status: BotAgentStatus.online,
          lastHeartbeat: now
        }
      }, tx)

      logOrder(order.orderNo, 'claim_order', { botId })
      return mapOrder(saved)
    })

    return { claimed: Boolean(claimed), order: claimed }
  }
}
