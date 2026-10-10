import Elysia from 'elysia'
import { CheckLoginModel } from './check.model'
import { CreateLoginService } from './check.service'
import { UserRepository } from '@/repositories/user.repository'

export const CheckLoginHttpController = new Elysia({ name: 'CheckLoginHttpController' })
  .post('/check-login', async ({ body }) => {
    const service = new CreateLoginService(
      new UserRepository()
    )
    const result = await service.create(body)
    return result
  }, {
    body: CheckLoginModel.request,
    detail: {
      summary: 'Check Login',
      description: 'Check Login'
    },
    response: {
      200: CheckLoginModel.successResponse
    }
  })
