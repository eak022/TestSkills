import Elysia from 'elysia'
import { PasswordResetModel } from './password-reset.model'
import { PasswordResetService } from './password-reset.service'
import { UserRepository } from '@/repositories/user.repository'

export const PasswordResetHttpController = new Elysia({ name: ' PasswordResetHttpController' })
  .post('/reset-password', async ({ body }) => {
    const service = new PasswordResetService(
      new UserRepository()
    )
    const result = await service.create(body)
    return result
  }, {
    body: PasswordResetModel.request,
    detail: {
      summary: 'Password Reset',
      description: 'Password Reset'
    },
    response: {
      200: PasswordResetModel.response
    }
  })
