import { NotFoundError } from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { isValidOrderNo } from '@/libs/utils/generate-running-number.util'
import { logOrder } from '@/libs/utils/order-logger.util'
import { type OrderActor, orderScope } from '@/libs/utils/order-access.util'
import { mapOrder, orderDetailSelect } from '@/modules/order/order.mapper'
import { type OrderRepository } from '@/repositories/order.repository'
import { type FindOneOrderModel } from './find-one.model'

export class FindOneOrderService {
  constructor (
    private readonly orderRepository: OrderRepository
  ) {}

  async execute (orderNo: string, actor: OrderActor): Promise<FindOneOrderModel.response> {
    if (!isValidOrderNo(orderNo)) {
      throw new BadRequestError('รูปแบบเลขออเดอร์ไม่ถูกต้อง ต้องเป็น ORD- ตามด้วยตัวเลข 13 หลัก')
    }

    // ออเดอร์ของคนอื่นตอบ 404 เหมือนไม่มีอยู่ — ไม่ให้เดาเลขออเดอร์ได้
    const data = await this.orderRepository.findFirst({
      where: { orderNo, deletedAt: null, ...orderScope(actor) },
      select: orderDetailSelect
    })

    if (!data) {
      throw new NotFoundError('ไม่พบออเดอร์')
    }

    logOrder(orderNo, 'find_one_order', { status: data.status, userId: actor.id })
    return mapOrder(data)
  }
}
