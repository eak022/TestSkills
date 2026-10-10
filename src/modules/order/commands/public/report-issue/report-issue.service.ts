import { NotFoundError } from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { logOrder } from '@/libs/utils/order-logger.util'
import { isValidOrderNo } from '@/libs/utils/generate-running-number.util'
import { actorLabel, type OrderActor, orderScope } from '@/libs/utils/order-access.util'
import { assertTransition, isCurrentTabStatus } from '@/libs/utils/order-state-machine.util'
import { mapOrder, orderDetailSelect } from '@/modules/order/order.mapper'
import { type OrderRepository } from '@/repositories/order.repository'
import { type OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { OrderStatus, prisma } from '@prisma/index'
import { type ReportIssueModel } from './report-issue.model'

export class ReportIssueService {
  constructor (
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: OrderTimelineRepository
  ) {}

  async execute (
    orderNo: string,
    body: ReportIssueModel.request,
    actor: OrderActor
  ): Promise<ReportIssueModel.response> {
    if (!isValidOrderNo(orderNo)) {
      throw new BadRequestError('รูปแบบเลขออเดอร์ไม่ถูกต้อง ต้องเป็น ORD- ตามด้วยตัวเลข 13 หลัก')
    }

    const updated = await prisma.$transaction(async (tx) => {
      const order = await this.orderRepository.findFirst({
        where: { orderNo, deletedAt: null, ...orderScope(actor) }
      }, tx)
      if (!order) {
        throw new NotFoundError('ไม่พบออเดอร์')
      }

      if (!isCurrentTabStatus(order.status)) {
        throw new BadRequestError('ออเดอร์นี้จบแล้ว ไม่สามารถแจ้งปัญหาได้')
      }

      const nextStatus = OrderStatus.DELAYED
      if (order.status !== nextStatus) {
        try {
          assertTransition(order.status, nextStatus)
        } catch {
          throw new BadRequestError(`ไม่สามารถแจ้งปัญหาจากสถานะ ${order.status}`)
        }
      }

      const saved = await this.orderRepository.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          issueNote: body.note,
          version: { increment: 1 }
        },
        select: orderDetailSelect
      }, tx)

      await this.timelineRepository.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: nextStatus,
          reason: `Issue reported by ${actorLabel(actor)}: ${body.note}`
        }
      }, tx)

      return saved
    })

    logOrder(orderNo, 'report_issue', { status: updated.status, userId: actor.id })
    return mapOrder(updated)
  }
}
