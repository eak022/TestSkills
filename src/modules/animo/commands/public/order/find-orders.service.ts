import { mapAniimoOrder, type AniimoOrderRow } from '@/libs/utils/animo-order.util'
import { type AniimoOrderRepository } from '@/repositories/aniimo-order.repository'
import { type OrderAnimoModel } from './order.model'

export class FindAniimoOrdersService {
  constructor (private readonly orderRepository: AniimoOrderRepository) {}

  async execute (query: OrderAnimoModel.listQuery): Promise<OrderAnimoModel.listResponse> {
    const result = await this.orderRepository.paginate(
      {
        orderBy: { createdAt: 'desc' }
      },
      {
        page: query.page || 1,
        limit: query.limit || 10
      }
    )

    return {
      message: 'success',
      totalPage: result.totalPage,
      page: result.page,
      limit: result.limit,
      count: result.count,
      data: result.data.map((row) => mapAniimoOrder(row as AniimoOrderRow))
    }
  }
}
