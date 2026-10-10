import { OrderStatus } from '@prisma/index'
import { t } from 'elysia'

export namespace OrderTimelineModel {
  export const params = t.Object({
    orderNo: t.String({ example: 'ORD-0000000000001' })
  })
  export type params = typeof params.static

  export const item = t.Object({
    id: t.Number(),
    fromStatus: t.Nullable(t.Enum(OrderStatus)),
    toStatus: t.Enum(OrderStatus),
    reason: t.Nullable(t.String()),
    createdAt: t.Date()
  })

  export const response = t.Object({
    orderNo: t.String(),
    data: t.Array(item)
  })
  export type response = typeof response.static
}
