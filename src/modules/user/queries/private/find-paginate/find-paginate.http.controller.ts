import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { FindUserPaginationModel } from './find-paginate.model'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { FindPaginateUserService } from './find-paginate.service'
import { UserRepository } from '@/repositories/user.repository'

const FindUserPaginateController = new Elysia({ name: 'FindUserPaginateController' })
  .use(UserAuthGuard)
  .get('/', async ({ query }) => {
    const service = new FindPaginateUserService(
      new UserRepository()
    )
    const result = service.execute(query)

    return result
  }, {
    detail: {
      security: BEARER_SECURITY,
      summary: 'Find User Paginate (admin)',
      description: 'เฉพาะแอดมิน (role ADMIN) — รายการผู้ใช้ที่ยังไม่ถูกลบ รวม role'
    },
    adminAuth: true,
    query: FindUserPaginationModel.query,
    response: {
      200: FindUserPaginationModel.successResponse
    }
  })

export default FindUserPaginateController
