import Elysia from 'elysia'
import { CommonResponseModel } from '@/libs/common/model.common'
import { BEARER_SECURITY } from '@/libs/docs/security'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { UserRepository } from '@/repositories/user.repository'
import { CreateUserModel } from './create.model'
import { CreateUserService } from './create.service'

export const CreateUserHttpController = new Elysia({ name: 'CreateUserHttpController' })
  .use(UserAuthGuard)
  .post('/', async ({ body }) => {
    const service = new CreateUserService(
      new UserRepository()
    )
    const result = await service.create(body)
    return result
  }, {
    adminAuth: true,
    body: CreateUserModel.request,
    detail: {
      security: BEARER_SECURITY,
      summary: 'Create User (admin)',
      description: 'เฉพาะแอดมิน (role ADMIN) — สร้างบัญชีลูกค้า role เป็น CUSTOMER ลูกค้าสมัครเองใช้ POST /api/v1/auth/register'
    },
    response: {
      200: CommonResponseModel
    }
  })
