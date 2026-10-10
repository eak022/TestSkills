import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { UpdateUserModel } from './update.model'
import { CommonResponseModel } from '@/libs/common/model.common'
import { UpdateUserService } from './update.service'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { UserRepository } from '@/repositories/user.repository'

export const UpdateUserHttpController = new Elysia({ name: 'UpdateUserHttpController' })
  .use(UserAuthGuard)
  .put('/:id', async ({ body, params }) => {
    const service = new UpdateUserService(
      new UserRepository()
    )
    const result = await service.update(Number(params.id), body)
    return result
  }, {
    params: UpdateUserModel.params,
    body: UpdateUserModel.request,
    detail: {
      security: BEARER_SECURITY,
      summary: 'Update User (admin)',
      description: 'เฉพาะแอดมิน (role ADMIN) — แก้ชื่อ อีเมล เบอร์ หรือรหัสผ่าน'
    },
    adminAuth: true,
    response: {
      200: CommonResponseModel
    }
  })
