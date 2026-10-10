import { OrderSchema } from '@/modules/order/order.schema'
import { t } from 'elysia'

export namespace ReportIssueModel {
  export const params = t.Object({
    orderNo: t.String({ example: 'ORD-0000000000001' })
  })
  export type params = typeof params.static

  export const request = t.Object({
    note: t.String({ minLength: 1, example: 'จ่ายเงินแล้วแต่เกมยังไม่เข้า' })
  })
  export type request = typeof request.static

  export const response = OrderSchema
  export type response = typeof response.static
}
