import Elysia from 'elysia'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { BEARER_SECURITY } from '@/libs/docs/security'
import { OrderRepository } from '@/repositories/order.repository'
import { OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { ReportIssueModel } from './report-issue.model'
import { ReportIssueService } from './report-issue.service'

export const ReportIssueHttpController = new Elysia({ name: 'ReportIssueHttpController' })
  .use(UserAuthGuard)
  .post('/:orderNo/report-issue', async ({ params, body, user }) => {
    const service = new ReportIssueService(
      new OrderRepository(),
      new OrderTimelineRepository()
    )
    return await service.execute(params.orderNo, body, user)
  }, {
    auth: true,
    params: ReportIssueModel.params,
    body: ReportIssueModel.request,
    detail: {
      summary: 'Report Order Issue',
      description: 'ต้อง login — ใช้กับออเดอร์ตัวเองที่ยังไม่จบ (current) จะย้ายเป็น DELAYED และบันทึกใน timeline ขอคืนเงินให้แจ้งผ่านทางนี้ แอดมินเป็นคนอนุมัติ',
      security: BEARER_SECURITY
    },
    response: {
      200: ReportIssueModel.response
    }
  })
