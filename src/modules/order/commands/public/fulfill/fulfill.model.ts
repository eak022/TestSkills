import { OrderSchema } from '@/modules/order/order.schema'
import { t } from 'elysia'

export namespace FulfillOrderModel {
  export const params = t.Object({
    orderNo: t.String({ example: 'ORD-0000000000001' })
  })
  export type params = typeof params.static

  // botId ไม่รับจาก body — ใช้บอทที่ยืนยันด้วย x-bot-key
  export const request = t.Object({
    result: t.Union([t.Literal('SUCCESS'), t.Literal('FAIL')], {
      example: 'SUCCESS',
      description: 'SUCCESS | FAIL'
    }),
    errorCode: t.Optional(t.String({ example: 'UID_INVALID' }))
  })
  export type request = typeof request.static

  export const response = OrderSchema
  export type response = typeof response.static
}
