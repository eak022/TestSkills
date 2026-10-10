import { t } from 'elysia'

export namespace PaymentWebhookModel {
  export const headers = t.Object({
    'x-event-id': t.String({
      minLength: 1,
      example: 'evt_paid_001',
      description: 'สร้างเอง ห้ามซ้ำ — ส่งค่าเดิมซ้ำจะได้ผลเดิม ไม่ประมวลผลซ้ำ'
    }),
    'x-webhook-signature': t.Optional(t.String({
      example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      description: 'HMAC-SHA256 (hex) ของ raw body ด้วย WEBHOOK_SECRET — ถ้าส่ง x-webhook-timestamp ให้เซ็นบน `${timestamp}.${rawBody}` ค่าตัวอย่างใช้ไม่ได้จริง ต้องคำนวณจาก body ที่ส่ง'
    })),
    'x-webhook-timestamp': t.Optional(t.String({
      example: '1760000000',
      description: 'Unix time (วินาที) ที่เซ็นไปด้วย — เกิน 5 นาทีถูกปฏิเสธ ไม่ส่งก็ได้'
    }))
  })
  export type headers = typeof headers.static

  export const request = t.Object({
    orderNo: t.String({
      example: 'ORD-0000000000001',
      description: 'ได้จาก POST /api/v1/orders รูปแบบ ORD- ตามด้วยตัวเลข 13 หลัก'
    }),
    status: t.Union([t.Literal('PAID'), t.Literal('FAILED')], {
      example: 'PAID',
      description: 'PAID | FAILED'
    }),
    providerRef: t.Optional(t.String({ example: 'bitcash-txn-1' }))
  })
  export type request = typeof request.static

  export const response = t.Object({
    outcome: t.String(),
    replayed: t.Boolean()
  })
  export type response = typeof response.static
}
