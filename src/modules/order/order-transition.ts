import { logOrder } from '@/libs/utils/order-logger.util'
import { assertTransition } from '@/libs/utils/order-state-machine.util'
import { mapOrder, orderDetailSelect } from '@/modules/order/order.mapper'
import { type OrderRepository } from '@/repositories/order.repository'
import { type OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { type OrderStatus, type Prisma } from '@prisma/index'
import { type PrismaTransactionalClient } from '@/libs/types/prisma-transaction-client.type'

export async function transitionOrder (
  orderRepository: OrderRepository,
  timelineRepository: OrderTimelineRepository,
  tx: PrismaTransactionalClient,
  order: { id: number, orderNo: string, status: OrderStatus },
  toStatus: OrderStatus,
  reason: string,
  extra: Prisma.OrderUpdateInput = {}
) {
  if (order.status !== toStatus) {
    assertTransition(order.status, toStatus)
  }

  const saved = await orderRepository.update({
    where: { id: order.id },
    data: {
      status: toStatus,
      version: { increment: 1 },
      ...extra
    },
    select: orderDetailSelect
  }, tx)

  await timelineRepository.create({
    data: {
      orderId: order.id,
      fromStatus: order.status,
      toStatus,
      reason
    }
  }, tx)

  logOrder(order.orderNo, 'status_transition', { from: order.status, to: toStatus, reason })
  return mapOrder(saved)
}
