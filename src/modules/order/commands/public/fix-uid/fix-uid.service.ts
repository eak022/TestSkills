import { NotFoundError } from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { isValidOrderNo } from '@/libs/utils/generate-running-number.util'
import { actorLabel, type OrderActor, orderScope } from '@/libs/utils/order-access.util'
import { transitionOrder } from '@/modules/order/order-transition'
import { type OrderRepository } from '@/repositories/order.repository'
import { type OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { OrderStatus, prisma } from '@prisma/index'
import { type FixUidModel } from './fix-uid.model'

export class FixUidService {
  constructor (
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: OrderTimelineRepository
  ) {}

  async execute (orderNo: string, body: FixUidModel.request, actor: OrderActor): Promise<FixUidModel.response> {
    if (!isValidOrderNo(orderNo)) {
      throw new BadRequestError('รูปแบบเลขออเดอร์ไม่ถูกต้อง ต้องเป็น ORD- ตามด้วยตัวเลข 13 หลัก')
    }

    return await prisma.$transaction(async (tx) => {
      // เจ้าของออเดอร์หรือแอดมินเท่านั้น
      const order = await this.orderRepository.findFirst({
        where: { orderNo, deletedAt: null, ...orderScope(actor) }
      }, tx)
      if (!order) {
        throw new NotFoundError('ไม่พบออเดอร์')
      }
      if (order.status !== OrderStatus.FAILED && order.status !== OrderStatus.DELAYED) {
        throw new BadRequestError('แก้ UID ได้เฉพาะออเดอร์ FAILED หรือ DELAYED')
      }

      return await transitionOrder(
        this.orderRepository,
        this.timelineRepository,
        tx,
        order,
        OrderStatus.QUEUED,
        `UID updated to ${body.playerUid} by ${actorLabel(actor)}, retry queued`,
        {
          playerUid: body.playerUid,
          retryCount: 0,
          failureKind: null,
          failureReason: null,
          claimedBy: null,
          claimedAt: null,
          leaseExpiresAt: null
        }
      )
    })
  }
}
