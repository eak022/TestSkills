import { OrderSchema } from '@/modules/order/order.schema'
import { t } from 'elysia'

export namespace RefundOrderModel {
  export const params = t.Object({
    orderNo: t.String({ example: 'ORD-0000000000001' })
  })
  export type params = typeof params.static

  export const request = t.Object({
    reason: t.Optional(t.String({ example: 'ลูกค้าขอคืนเงิน' }))
  })
  export type request = typeof request.static

  export const response = OrderSchema
  export type response = typeof response.static
}
