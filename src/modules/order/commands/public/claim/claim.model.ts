import { OrderSchema } from '@/modules/order/order.schema'
import { t } from 'elysia'

export namespace ClaimOrderModel {
  // ไม่มี body — บอทระบุตัวด้วย header x-bot-key
  export const response = t.Object({
    claimed: t.Boolean(),
    order: t.Nullable(OrderSchema)
  })
  export type response = typeof response.static
}
