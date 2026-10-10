import { t } from 'elysia'
import {
  animoCharacterSchema,
  animoPackSchema,
  animoPaymentSchema
} from '../quote/quote.model'

const aniimoOrder = t.Object({
  orderNo: t.String({
    example: 'ANM-0000000000001',
    description: 'ได้จาก POST /api/v1/animo/order รูปแบบ ANM- ตามด้วยตัวเลข 13 หลัก คนละชุดกับ ORD- ของออเดอร์เติมเกม'
  }),
  status: t.Literal('DRAFT', {
    example: 'DRAFT',
    description: 'DRAFT = บันทึกในระบบแล้ว แต่ยังไม่ยิง place_order และยังไม่จ่าย'
  }),
  submitted: t.Literal(false, {
    example: false,
    description: 'ยังไม่เรียก POST /api/place_order ของร้าน'
  }),
  payUrl: t.Union([
    t.String(),
    t.Null()
  ], {
    example: null,
    description: 'เป็น null เพราะยังไม่มี AuthCode จากร้าน'
  }),
  paymentHost: t.Literal('https://fp-payment-worldx.kingsgroupgames.com', {
    example: 'https://fp-payment-worldx.kingsgroupgames.com',
    description: 'payment_host ในคำตอบ place_order ของร้าน'
  }),
  createdAt: t.Date({ example: '2026-10-09T13:00:00.000Z' }),
  updatedAt: t.Date({ example: '2026-10-09T13:00:00.000Z' }),
  character: animoCharacterSchema,
  pack: animoPackSchema,
  payment: animoPaymentSchema
})

export namespace OrderAnimoModel {
  export const request = t.Object({
    uid: t.String({
      minLength: 1,
      example: '412000837577',
      description: 'UID ของคนที่จะเติม = roleId จาก GET /api/player/roles'
    }),
    server: t.String({
      minLength: 1,
      example: 'Aniimo-Apac',
      description: 'serverAreaName หรือรหัส serverArea เช่น 4'
    }),
    productId: t.String({
      minLength: 1,
      example: 'com.x.aniimos.2.1.30',
      description: 'ได้จาก GET /api/v1/animo/packs → packs[].productId'
    })
  })
  export type request = typeof request.static

  export const response = aniimoOrder
  export type response = typeof response.static

  export const listQuery = t.Object({
    page: t.Integer({ default: 1, minimum: 1, example: 1, description: 'หน้าที่ต้องการ เริ่มที่ 1' }),
    limit: t.Integer({ default: 10, minimum: 1, example: 10, description: 'จำนวนต่อหน้า' })
  })
  export type listQuery = typeof listQuery.static

  export const listResponse = t.Object({
    message: t.Literal('success', { example: 'success' }),
    totalPage: t.Number({ example: 1 }),
    page: t.Number({ example: 1 }),
    limit: t.Number({ example: 10 }),
    count: t.Number({ example: 1 }),
    data: t.Array(aniimoOrder)
  })
  export type listResponse = typeof listResponse.static

  export const params = t.Object({
    orderNo: t.String({
      example: 'ANM-0000000000001',
      description: 'ได้จาก POST /api/v1/animo/order รูปแบบ ANM- ตามด้วยตัวเลข 13 หลัก'
    })
  })
  export type params = typeof params.static
}
