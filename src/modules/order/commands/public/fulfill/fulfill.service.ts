import { NotFoundError } from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { isValidOrderNo } from '@/libs/utils/generate-running-number.util'
import { classifyTopupError, decideStaleClaim, retryBackoffMs } from '@/libs/utils/order-ops.util'
import { transitionOrder } from '@/modules/order/order-transition'
import { type BotAgentRepository } from '@/repositories/bot-agent.repository'
import { type OrderRepository } from '@/repositories/order.repository'
import { type OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { BotWorkState, OrderFailureKind, OrderStatus, prisma } from '@prisma/index'
import { type FulfillOrderModel } from './fulfill.model'

export class FulfillOrderService {
  constructor (
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: OrderTimelineRepository,
    private readonly botAgentRepository: BotAgentRepository
  ) {}

  async execute (orderNo: string, body: FulfillOrderModel.request, botId: string): Promise<FulfillOrderModel.response> {
    if (!isValidOrderNo(orderNo)) {
      throw new BadRequestError('รูปแบบเลขออเดอร์ไม่ถูกต้อง ต้องเป็น ORD- ตามด้วยตัวเลข 13 หลัก')
    }

    const mapped = await prisma.$transaction(async (tx) => {
      const order = await this.orderRepository.findFirst({
        where: { orderNo, deletedAt: null }
      }, tx)
      if (!order) {
        throw new NotFoundError('ไม่พบออเดอร์')
      }
      if (order.status !== OrderStatus.IN_PROGRESS || order.claimedBy !== botId) {
        throw new BadRequestError('บอทนี้ไม่ได้ทำออเดอร์นี้อยู่')
      }

      const clearClaim = {
        claimedBy: null,
        claimedAt: null,
        leaseExpiresAt: null,
        lastHeartbeatAt: null
      }

      let result
      if (body.result === 'SUCCESS') {
        result = await transitionOrder(
          this.orderRepository,
          this.timelineRepository,
          tx,
          order,
          OrderStatus.COMPLETED,
          `Top-up success by ${botId}`,
          clearClaim
        )
      } else {
        const errorCode = body.errorCode ?? 'UNKNOWN'
        const kind = classifyTopupError(errorCode)
        if (kind === OrderFailureKind.PERMANENT) {
          result = await transitionOrder(
            this.orderRepository,
            this.timelineRepository,
            tx,
            order,
            OrderStatus.FAILED,
            `Permanent top-up error: ${errorCode}`,
            { ...clearClaim, failureKind: kind, failureReason: errorCode }
          )
        } else {
          const decision = decideStaleClaim(order.retryCount)
          const backoffUntil = new Date(Date.now() + retryBackoffMs(decision.retryCount))
          result = await transitionOrder(
            this.orderRepository,
            this.timelineRepository,
            tx,
            order,
            decision.nextStatus,
            `Transient top-up error: ${errorCode} (retry ${decision.retryCount})`,
            {
              claimedBy: null,
              claimedAt: null,
              lastHeartbeatAt: null,
              leaseExpiresAt: decision.nextStatus === OrderStatus.QUEUED ? backoffUntil : null,
              retryCount: decision.retryCount,
              failureKind: kind,
              failureReason: errorCode
            }
          )
        }
      }

      await this.botAgentRepository.updateMany({
        where: { id: botId },
        data: {
          lastJobResult: body.result === 'SUCCESS' ? 'Done' : 'Failed',
          workState: BotWorkState.standby
        }
      }, tx)

      return result
    })

    return mapped
  }
}
