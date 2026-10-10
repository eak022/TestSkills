import { NotFoundError } from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { isValidAniimoOrderNo, mapAniimoOrder, type AniimoOrderRow } from '@/libs/utils/animo-order.util'
import { logOrder } from '@/libs/utils/order-logger.util'
import { type AniimoOrderRepository } from '@/repositories/aniimo-order.repository'
import { type OrderAnimoModel } from './order.model'

export class FindAniimoOrderService {
  constructor (private readonly orderRepository: AniimoOrderRepository) {}

  async execute (orderNo: string): Promise<OrderAnimoModel.response> {
    if (!isValidAniimoOrderNo(orderNo)) {
      throw new BadRequestError('รูปแบบเลขออเดอร์ไม่ถูกต้อง ต้องเป็น ANM- ตามด้วยตัวเลข 13 หลัก')
    }

    const row = await this.orderRepository.findFirst({
      where: { orderNo }
    })
    if (!row) {
      throw new NotFoundError('ไม่พบออเดอร์ Aniimo นี้')
    }

    logOrder(orderNo, 'find_aniimo_order')
    return mapAniimoOrder(row as AniimoOrderRow)
  }
}
