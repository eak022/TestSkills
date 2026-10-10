import Elysia from 'elysia'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { BEARER_SECURITY } from '@/libs/docs/security'
import { OrderRepository } from '@/repositories/order.repository'
import { OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { RefundOrderModel } from './refund.model'
import { RefundOrderService } from './refund.service'

export const RefundOrderHttpController = new Elysia({ name: 'RefundOrderHttpController' })
  .use(UserAuthGuard)
  .post('/:orderNo/refund', async ({ params, body, user }) => {
    const service = new RefundOrderService(
      new OrderRepository(),
      new OrderTimelineRepository()
    )
    return await service.execute(params.orderNo, body, user)
  }, {
    adminAuth: true,
    params: RefundOrderModel.params,
    body: RefundOrderModel.request,
    detail: {
      summary: 'Refund order (admin)',
      description: 'เฉพาะแอดมิน (role ADMIN) — คืนเงินหลัง FAILED / EXPIRED / DELAYED / COMPLETED ตาม state machine ลูกค้าขอคืนผ่าน report-issue',
      security: BEARER_SECURITY
    },
    response: {
      200: RefundOrderModel.response
    }
  })
