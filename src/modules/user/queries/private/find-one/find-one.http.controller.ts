import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { FindOneUserModel } from './find-one.model'
import { FindOneUserService } from './find-one.service'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { UserRepository } from '@/repositories/user.repository'

export const FindOneUserHttpController = new Elysia({ name: 'FindOneUserHttpController' })
  .use(UserAuthGuard)
  .get('/:id', async ({ params }) => {
    const service = new FindOneUserService(
      new UserRepository()
    )
    const result = await service.execute(Number(params.id))
    return result
  }, {
    params: FindOneUserModel.params,
    detail: {
      security: BEARER_SECURITY,
      summary: 'Find One User (admin)',
      description: 'เฉพาะแอดมิน (role ADMIN) — รายละเอียดผู้ใช้ รวม role ไม่ส่งรหัสผ่าน'
    },
    adminAuth: true,
    response: {
      200: FindOneUserModel.response
    }
  })
