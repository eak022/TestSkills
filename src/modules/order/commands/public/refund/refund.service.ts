import { NotFoundError } from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { isValidOrderNo } from '@/libs/utils/generate-running-number.util'
import { actorLabel, type OrderActor } from '@/libs/utils/order-access.util'
import { canTransition } from '@/libs/utils/order-state-machine.util'
import { transitionOrder } from '@/modules/order/order-transition'
import { type OrderRepository } from '@/repositories/order.repository'
import { type OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { OrderStatus, prisma } from '@prisma/index'
import { type RefundOrderModel } from './refund.model'

export class RefundOrderService {
  constructor (
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: OrderTimelineRepository
  ) {}

  async execute (orderNo: string, body: RefundOrderModel.request, actor: OrderActor): Promise<RefundOrderModel.response> {
    if (!isValidOrderNo(orderNo)) {
      throw new BadRequestError('รูปแบบเลขออเดอร์ไม่ถูกต้อง ต้องเป็น ORD- ตามด้วยตัวเลข 13 หลัก')
    }

    return await prisma.$transaction(async (tx) => {
      const order = await this.orderRepository.findFirst({
        where: { orderNo, deletedAt: null }
      }, tx)
      if (!order) {
        throw new NotFoundError('ไม่พบออเดอร์')
      }
      if (order.status === OrderStatus.REFUNDED) {
        throw new BadRequestError('ออเดอร์นี้คืนเงินแล้ว')
      }
      if (!canTransition(order.status, OrderStatus.REFUNDED)) {
        throw new BadRequestError(`ไม่สามารถคืนเงินจากสถานะ ${order.status}`)
      }

      return await transitionOrder(
        this.orderRepository,
        this.timelineRepository,
        tx,
        order,
        OrderStatus.REFUNDED,
        `Refund by ${actorLabel(actor)}: ${body.reason ?? 'no reason given'}`,
        { claimedBy: null, claimedAt: null, leaseExpiresAt: null }
      )
    })
  }
}
