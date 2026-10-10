import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { DeleteUserModel } from './delete.model'
import { CommonResponseModel } from '@/libs/common/model.common'
import { DeleteUserService } from './delete.service'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { UserRepository } from '@/repositories/user.repository'

export const DeleteUserHttpController = new Elysia({ name: 'DeleteUserHttpController' })
  .use(UserAuthGuard)
  .delete('/:id', async ({ params }) => {
    const service = new DeleteUserService(
      new UserRepository()
    )
    const result = await service.update(Number(params.id))
    return result
  }, {
    params: DeleteUserModel.params,
    detail: {
      security: BEARER_SECURITY,
      summary: 'Delete User (admin)',
      description: 'เฉพาะแอดมิน (role ADMIN) — ปิดบัญชี (soft delete) ผู้ใช้ที่ลบแล้ว login ไม่ได้'
    },
    adminAuth: true,
    response: {
      200: CommonResponseModel
    }
  })
