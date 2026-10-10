import Elysia from 'elysia'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { BEARER_SECURITY } from '@/libs/docs/security'
import { OrderRepository } from '@/repositories/order.repository'
import { FindOrderPaginationModel } from './find-paginate.model'
import { FindPaginateOrderService } from './find-paginate.service'

const FindOrderPaginateController = new Elysia({ name: 'FindOrderPaginateController' })
  .use(UserAuthGuard)
  .get('/', async ({ query, user }) => {
    const service = new FindPaginateOrderService(new OrderRepository())
    return await service.execute(query, user)
  }, {
    auth: true,
    detail: {
      summary: 'Find Order Paginate',
      description: 'ต้อง login — รายการออเดอร์ของตัวเอง (แอดมินเห็นทั้งหมด) tab=current (ยังไม่จบ) หรือ history เรียงใหม่ไปเก่า',
      security: BEARER_SECURITY
    },
    query: FindOrderPaginationModel.query,
    response: {
      200: FindOrderPaginationModel.successResponse
    }
  })

export default FindOrderPaginateController
