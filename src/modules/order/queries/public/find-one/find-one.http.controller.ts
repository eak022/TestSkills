import Elysia from 'elysia'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { BEARER_SECURITY } from '@/libs/docs/security'
import { OrderRepository } from '@/repositories/order.repository'
import { FindOneOrderModel } from './find-one.model'
import { FindOneOrderService } from './find-one.service'

export const FindOneOrderHttpController = new Elysia({ name: 'FindOneOrderHttpController' })
  .use(UserAuthGuard)
  .get('/:orderNo', async ({ params, user }) => {
    const service = new FindOneOrderService(new OrderRepository())
    return await service.execute(params.orderNo, user)
  }, {
    auth: true,
    params: FindOneOrderModel.params,
    detail: {
      summary: 'Find One Order',
      description: 'ต้อง login — ใช้ orderNo จาก Create Order เช่น ORD-0000000000001 ดูได้เฉพาะออเดอร์ตัวเอง (แอดมินดูได้ทุกอัน) format ผิด = 400, ไม่พบ/ไม่ใช่ของตัวเอง = 404',
      security: BEARER_SECURITY
    },
    response: {
      200: FindOneOrderModel.response
    }
  })
