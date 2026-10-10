import Elysia from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { FirstLoginModel } from './first-login.model'
import { CreateLoginService } from './first-login.service'
import { UserRepository } from '@/repositories/user.repository'
import { AuthService } from '@/modules/auth/auth.service'

export const FirstLoginHttpController = new Elysia({ name: 'FirstLoginHttpController' })
  .use(jwt({
    name: 'jwt',
    secret: process.env.USER_AUTH_SECRET || 'your-secret-key'
  }))
  .post('/first-login', async ({ body, jwt }) => {
    const service = new CreateLoginService(
      new UserRepository(),
      new AuthService(jwt)
    )
    const result = await service.create(body)
    return result
  }, {
    body: FirstLoginModel.request,
    detail: {
      summary: 'First Login',
      description: 'First Login'
    },
    response: {
      200: FirstLoginModel.response
    }
  })
