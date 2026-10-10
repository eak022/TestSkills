import { type OrderActor, orderScope } from '@/libs/utils/order-access.util'
import { statusesForTab } from '@/libs/utils/order-state-machine.util'
import { mapOrder, orderDetailSelect } from '@/modules/order/order.mapper'
import { type OrderRepository } from '@/repositories/order.repository'
import { type FindOrderPaginationModel } from './find-paginate.model'

export class FindPaginateOrderService {
  constructor (
    private readonly orderRepository: OrderRepository
  ) {}

  async execute (
    query: FindOrderPaginationModel.query,
    actor: OrderActor
  ): Promise<FindOrderPaginationModel.successResponse> {
    const result = await this.orderRepository.paginate(
      {
        where: {
          deletedAt: null,
          status: { in: statusesForTab(query.tab) },
          ...orderScope(actor)
        },
        orderBy: { createdAt: 'desc' },
        select: orderDetailSelect
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
      data: result.data.map(mapOrder)
    }
  }
}
