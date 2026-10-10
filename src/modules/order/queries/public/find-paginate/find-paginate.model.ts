import { CommonPaginationResponseModel } from '@/libs/common/model.common'
import { OrderSchema } from '@/modules/order/order.schema'
import { t } from 'elysia'

export namespace FindOrderPaginationModel {
  export const query = t.Object({
    tab: t.Union([t.Literal('current'), t.Literal('history')], { example: 'current' }),
    page: t.Integer({ default: 1, minimum: 1, example: 1, description: 'หน้าที่ต้องการ เริ่มที่ 1' }),
    limit: t.Integer({ default: 10, minimum: 1, example: 10, description: 'จำนวนต่อหน้า' })
  })
  export type query = typeof query.static

  export const successResponse = t.Composite([
    CommonPaginationResponseModel,
    t.Object({
      data: t.Array(OrderSchema)
    })
  ])
  export type successResponse = typeof successResponse.static
}
