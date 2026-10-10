import { NotFoundError } from 'elysia'
import { BadRequestError, UnauthorizedError } from '@/libs/middlewares/error-handler/domain'
import { isValidOrderNo } from '@/libs/utils/generate-running-number.util'
import { logOrder } from '@/libs/utils/order-logger.util'
import { latePaidWebhookOutcome } from '@/libs/utils/order-ops.util'
import { verifyWebhookSignature } from '@/libs/utils/webhook-signature.util'
import { transitionOrder } from '@/modules/order/order-transition'
import { type OrderRepository } from '@/repositories/order.repository'
import { type OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { type PaymentAttemptRepository } from '@/repositories/payment-attempt.repository'
import { type WebhookEventRepository } from '@/repositories/webhook-event.repository'
import { OrderStatus, PaymentAttemptStatus, prisma } from '@prisma/index'
import { type PaymentWebhookModel } from './webhook.model'

export class PaymentWebhookService {
  constructor (
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: OrderTimelineRepository,
    private readonly paymentAttemptRepository: PaymentAttemptRepository,
    private readonly webhookEventRepository: WebhookEventRepository
  ) {}

  private verifySignature (rawBody: string, headers: PaymentWebhookModel.headers): void {
    const result = verifyWebhookSignature({
      secret: process.env.WEBHOOK_SECRET,
      production: process.env.NODE_ENV === 'production',
      rawBody,
      signature: headers['x-webhook-signature'],
      timestamp: headers['x-webhook-timestamp']
    })

    switch (result) {
      case 'ok':
        return
      case 'skipped':
        console.warn(JSON.stringify({ message: 'webhook_signature_skipped', reason: 'WEBHOOK_SECRET not set (non-production)' }))
        return
      case 'not_configured':
        // ความผิดพลาดฝั่งเรา ไม่ใช่ของผู้เรียก — ปฏิเสธเป็น 500 ให้เห็นชัดว่าต้องตั้งค่า
        throw new Error('WEBHOOK_SECRET ยังไม่ได้ตั้งค่า ปฏิเสธ webhook ในโหมด production')
      case 'missing_signature':
        throw new UnauthorizedError('ขาด webhook signature')
      case 'stale':
        throw new UnauthorizedError('webhook timestamp เก่าเกินไป')
      default:
        throw new UnauthorizedError('webhook signature ไม่ถูกต้อง')
    }
  }

  async execute (
    headers: PaymentWebhookModel.headers,
    body: PaymentWebhookModel.request,
    rawBody: string
  ): Promise<PaymentWebhookModel.response> {
    this.verifySignature(rawBody, headers)

    const eventId = headers['x-event-id']
    const existing = await this.webhookEventRepository.findUnique({
      where: { eventId }
    })
    if (existing) {
      logOrder(existing.orderNo ?? body.orderNo, 'webhook_replay', { eventId, outcome: existing.outcome })
      return { outcome: existing.outcome, replayed: true }
    }

    if (!isValidOrderNo(body.orderNo)) {
      throw new BadRequestError('รูปแบบเลขออเดอร์ไม่ถูกต้อง ต้องเป็น ORD- ตามด้วยตัวเลข 13 หลัก')
    }

    const outcome = await this.runInTransaction(eventId, async (tx) => {
      const replay = await this.webhookEventRepository.findUnique({
        where: { eventId }
      }, tx)
      if (replay) return replay.outcome

      const order = await this.orderRepository.findFirst({
        where: { orderNo: body.orderNo, deletedAt: null }
      }, tx)
      if (!order) {
        throw new NotFoundError('ไม่พบออเดอร์')
      }

      let result = 'ignored'
      if (body.status === 'PAID') {
        const decision = latePaidWebhookOutcome(order.status)
        if (decision === 'queue') {
          await this.upsertSucceededPayment(order.id, body.providerRef, tx)
          await transitionOrder(
            this.orderRepository,
            this.timelineRepository,
            tx,
            order,
            OrderStatus.QUEUED,
            `Bank webhook PAID (${eventId})`
          )
          result = 'queued'
        } else if (decision === 'credit') {
          await this.upsertSucceededPayment(order.id, body.providerRef, tx)
          await transitionOrder(
            this.orderRepository,
            this.timelineRepository,
            tx,
            order,
            OrderStatus.REFUNDED,
            `Late webhook after expiry — credit/refund (${eventId})`
          )
          result = 'credited'
        } else {
          result = 'ignored_out_of_order'
        }
      } else if (order.status === OrderStatus.PENDING_PAYMENT) {
        await transitionOrder(
          this.orderRepository,
          this.timelineRepository,
          tx,
          order,
          OrderStatus.FAILED,
          `Bank webhook FAILED (${eventId})`,
          { failureKind: 'PERMANENT', failureReason: 'PAYMENT_FAILED' }
        )
        result = 'payment_failed'
      }

      await this.webhookEventRepository.create({
        data: { eventId, orderNo: order.orderNo, outcome: result }
      }, tx)

      logOrder(order.orderNo, 'webhook_processed', { eventId, outcome: result })
      return result
    })

    return { outcome, replayed: false }
  }

  // event เดียวกันมาพร้อมกัน: ตัวที่แพ้ชน PK ของ WebhookEvent แล้ว rollback ทั้งก้อน → คืนผลของตัวที่ชนะ ไม่ประมวลซ้ำ
  private async runInTransaction (
    eventId: string,
    work: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<string>
  ): Promise<string> {
    try {
      return await prisma.$transaction(work)
    } catch (error) {
      if ((error as { code?: string } | null)?.code === 'P2002') {
        const winner = await this.webhookEventRepository.findUnique({ where: { eventId } })
        if (winner) return winner.outcome
      }
      throw error
    }
  }

  private async upsertSucceededPayment (
    orderId: number,
    providerRef: string | undefined,
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
  ) {
    const existing = await this.paymentAttemptRepository.findUnique({
      where: { orderId }
    }, tx)
    if (existing) {
      if (existing.status === PaymentAttemptStatus.SUCCEEDED) return
      await this.paymentAttemptRepository.update({
        where: { orderId },
        data: { status: PaymentAttemptStatus.SUCCEEDED, providerRef }
      }, tx)
      return
    }
    await this.paymentAttemptRepository.create({
      data: {
        orderId,
        status: PaymentAttemptStatus.SUCCEEDED,
        providerRef
      }
    }, tx)
  }
}
