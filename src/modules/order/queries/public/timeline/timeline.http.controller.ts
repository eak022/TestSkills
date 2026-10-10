import Elysia from 'elysia'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { BEARER_SECURITY } from '@/libs/docs/security'
import { OrderRepository } from '@/repositories/order.repository'
import { OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { OrderTimelineModel } from './timeline.model'
import { OrderTimelineService } from './timeline.service'

export const OrderTimelineHttpController = new Elysia({ name: 'OrderTimelineHttpController' })
  .use(UserAuthGuard)
  .get('/:orderNo/timeline', async ({ params, user }) => {
    const service = new OrderTimelineService(
      new OrderRepository(),
      new OrderTimelineRepository()
    )
    return await service.execute(params.orderNo, user)
  }, {
    auth: true,
    params: OrderTimelineModel.params,
    detail: {
      summary: 'Order Timeline',
      description: 'ต้อง login — ประวัติเปลี่ยนสถานะพร้อมเวลา เฉพาะออเดอร์ตัวเอง (แอดมินดูได้ทุกอัน)',
      security: BEARER_SECURITY
    },
    response: {
      200: OrderTimelineModel.response
    }
  })
