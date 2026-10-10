import { NotFoundError } from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { isValidOrderNo } from '@/libs/utils/generate-running-number.util'
import { type OrderActor, orderScope } from '@/libs/utils/order-access.util'
import { logOrder } from '@/libs/utils/order-logger.util'
import { type OrderRepository } from '@/repositories/order.repository'
import { type OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { type OrderTimelineModel } from './timeline.model'

export class OrderTimelineService {
  constructor (
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: OrderTimelineRepository
  ) {}

  async execute (orderNo: string, actor: OrderActor): Promise<OrderTimelineModel.response> {
    if (!isValidOrderNo(orderNo)) {
      throw new BadRequestError('รูปแบบเลขออเดอร์ไม่ถูกต้อง ต้องเป็น ORD- ตามด้วยตัวเลข 13 หลัก')
    }

    const order = await this.orderRepository.findFirst({
      where: { orderNo, deletedAt: null, ...orderScope(actor) },
      select: { id: true, orderNo: true }
    })
    if (!order) {
      throw new NotFoundError('ไม่พบออเดอร์')
    }

    const rows = await this.timelineRepository.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        fromStatus: true,
        toStatus: true,
        reason: true,
        createdAt: true
      }
    })

    logOrder(orderNo, 'find_order_timeline', { count: rows.length, userId: actor.id })
    return { orderNo, data: rows }
  }
}
