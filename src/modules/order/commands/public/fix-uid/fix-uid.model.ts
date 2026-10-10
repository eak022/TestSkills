import { OrderSchema } from '@/modules/order/order.schema'
import { t } from 'elysia'

export namespace FixUidModel {
  export const params = t.Object({
    orderNo: t.String({ example: 'ORD-0000000000001' })
  })
  export type params = typeof params.static

  export const request = t.Object({
    playerUid: t.String({ minLength: 1, example: '5250140737488366145' })
  })
  export type request = typeof request.static

  export const response = OrderSchema
  export type response = typeof response.static
}
