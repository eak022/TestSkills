import Elysia from 'elysia'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { BEARER_SECURITY } from '@/libs/docs/security'
import { OrderRepository } from '@/repositories/order.repository'
import { OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { FixUidModel } from './fix-uid.model'
import { FixUidService } from './fix-uid.service'

export const FixUidHttpController = new Elysia({ name: 'FixUidHttpController' })
  .use(UserAuthGuard)
  .post('/:orderNo/fix-uid', async ({ params, body, user }) => {
    const service = new FixUidService(
      new OrderRepository(),
      new OrderTimelineRepository()
    )
    return await service.execute(params.orderNo, body, user)
  }, {
    auth: true,
    params: FixUidModel.params,
    body: FixUidModel.request,
    detail: {
      summary: 'Fix player UID and requeue',
      description: 'ต้อง login — เจ้าของออเดอร์ (หรือแอดมิน) แก้ UID หลังเติมไม่สำเร็จเพราะ UID ผิด แล้วส่งกลับคิว ใช้ได้กับ FAILED / DELAYED',
      security: BEARER_SECURITY
    },
    response: {
      200: FixUidModel.response
    }
  })
