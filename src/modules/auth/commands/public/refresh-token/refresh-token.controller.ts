import Elysia from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { RefreshModel } from './refresh-token.model'
import { LoginService } from './refresh-token.service'
import { UserRepository } from '@/repositories/user.repository'
import { AuthService } from '@/modules/auth/auth.service'
import { SessionRepository } from '@/repositories/session.repository'

export const RefreshTokenHttpController = new Elysia({ name: 'RefreshTokenHttpController' })
  .use(jwt({
    name: 'jwt',
    secret: process.env.USER_AUTH_SECRET || 'your-secret-key'
  }))
  .post('/refresh', async ({ body, jwt }) => {
    const service = new LoginService(
      new UserRepository(),
      new AuthService(jwt),
      new SessionRepository()
    )
    const result = await service.create(body)
    return result
  }, {
    body: RefreshModel.request,
    detail: {
      summary: 'Refresh Token',
      description: 'Refresh Token'
    },
    response: {
      200: RefreshModel.response
    }
  })
