import { OrderSchema } from '@/modules/order/order.schema'
import { t } from 'elysia'

export namespace CreateOrderModel {
  export const headers = t.Object({
    'idempotency-key': t.String({
      minLength: 1,
      description: 'Client สร้างเอง (เช่น UUID) ไม่ได้มาจาก API — key เดิม + body เดิม (ของผู้ใช้เดิม) = ไม่สร้างซ้ำ',
      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    })
  })
  export type headers = typeof headers.static

  // userId ไม่รับจาก body — ใช้ผู้ใช้ที่ login อยู่เท่านั้น
  export const request = t.Object({
    playerUid: t.String({ minLength: 1, example: '5250140737488366145' }),
    packageId: t.Number({ example: 1 }),
    serverId: t.Number({ example: 1 })
  })
  export type request = typeof request.static

  export const response = OrderSchema
  export type response = typeof response.static
}
