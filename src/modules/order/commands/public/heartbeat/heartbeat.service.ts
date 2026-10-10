import { NotFoundError } from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { isValidOrderNo } from '@/libs/utils/generate-running-number.util'
import { logOrder } from '@/libs/utils/order-logger.util'
import { LEASE_MS } from '@/libs/utils/order-ops.util'
import { mapOrder, orderDetailSelect } from '@/modules/order/order.mapper'
import { type BotAgentRepository } from '@/repositories/bot-agent.repository'
import { type OrderRepository } from '@/repositories/order.repository'
import { BotAgentStatus, OrderStatus, prisma } from '@prisma/index'
import { type OrderHeartbeatModel } from './heartbeat.model'

export class OrderHeartbeatService {
  constructor (
    private readonly orderRepository: OrderRepository,
    private readonly botAgentRepository: BotAgentRepository
  ) {}

  async execute (orderNo: string, botId: string): Promise<OrderHeartbeatModel.response> {
    if (!isValidOrderNo(orderNo)) {
      throw new BadRequestError('รูปแบบเลขออเดอร์ไม่ถูกต้อง ต้องเป็น ORD- ตามด้วยตัวเลข 13 หลัก')
    }

    const order = await this.orderRepository.findFirst({
      where: { orderNo, deletedAt: null }
    })
    if (!order) {
      throw new NotFoundError('ไม่พบออเดอร์')
    }
    if (order.status !== OrderStatus.IN_PROGRESS || order.claimedBy !== botId) {
      throw new BadRequestError('บอทนี้ไม่ได้ claim ออเดอร์นี้อยู่')
    }

    const now = new Date()
    const saved = await prisma.$transaction(async (tx) => {
      const updated = await this.orderRepository.update({
        where: { id: order.id },
        data: {
          lastHeartbeatAt: now,
          leaseExpiresAt: new Date(now.getTime() + LEASE_MS)
        },
        select: orderDetailSelect
      }, tx)

      // เครื่องที่กำลังทำงานต้องไม่ถูกมองว่าเงียบ
      await this.botAgentRepository.updateMany({
        where: { id: botId },
        data: { lastHeartbeat: now, status: BotAgentStatus.online }
      }, tx)

      return updated
    })

    logOrder(orderNo, 'order_heartbeat', { botId })
    return mapOrder(saved)
  }
}
