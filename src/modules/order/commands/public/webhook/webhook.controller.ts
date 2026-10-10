import Elysia from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { OrderRepository } from '@/repositories/order.repository'
import { OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { PaymentAttemptRepository } from '@/repositories/payment-attempt.repository'
import { WebhookEventRepository } from '@/repositories/webhook-event.repository'
import { PaymentWebhookModel } from './webhook.model'
import { PaymentWebhookService } from './webhook.service'

// เก็บ raw body ไว้ตรวจ signature — ต้องเป็นไบต์ที่ผู้ส่งเซ็นจริง ไม่ใช่ JSON ที่ serialize ใหม่
const rawBodies = new WeakMap<Request, string>()

export const PaymentWebhookHttpController = new Elysia({ name: 'PaymentWebhookHttpController' })
  .post('/webhook', async ({ headers, body, request }) => {
    const service = new PaymentWebhookService(
      new OrderRepository(),
      new OrderTimelineRepository(),
      new PaymentAttemptRepository(),
      new WebhookEventRepository()
    )
    return await service.execute(headers, body, rawBodies.get(request) ?? JSON.stringify(body))
  }, {
    parse: [
      async ({ request }) => {
        const text = await request.text()
        rawBodies.set(request, text)
        try {
          return JSON.parse(text)
        } catch {
          throw new BadRequestError('webhook body ต้องเป็น JSON')
        }
      },
      'json'
    ],
    headers: PaymentWebhookModel.headers,
    body: PaymentWebhookModel.request,
    detail: {
      summary: 'Bank payment webhook',
      description: [
        'เรียกโดยผู้ให้บริการจ่ายเงิน (ไม่ใช่ลูกค้า) — ยืนยันด้วย HMAC signature ไม่ใช่ JWT',
        'production ต้องตั้ง WEBHOOK_SECRET ไม่งั้นปฏิเสธทุกคำขอ; dev ไม่ตั้งจะข้ามการตรวจ',
        'Idempotent ตาม x-event-id — มาซ้ำไม่ประมวลซ้ำ มาช้าหลังหมดอายุตีเป็นเครดิต/คืนเงิน'
      ].join('\n')
    },
    response: {
      200: PaymentWebhookModel.response
    }
  })
