import { OrderSchema } from '@/modules/order/order.schema'
import { t } from 'elysia'

export namespace FindOneOrderModel {
  export const params = t.Object({
    orderNo: t.String({ example: 'ORD-0000000000001' })
  })
  export type params = typeof params.static

  export const response = OrderSchema
  export type response = typeof response.static
}
