import Elysia from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { LoginModel } from './login.model'
import { LoginService } from './login.service'
import { UserRepository } from '@/repositories/user.repository'
import { AuthService } from '@/modules/auth/auth.service'

export const LoginHttpController = new Elysia({ name: 'LoginHttpController' })
  .use(jwt({
    name: 'jwt',
    secret: process.env.USER_AUTH_SECRET || 'your-secret-key'
  }))
  .post('/login', async ({ body, jwt }) => {
    const service = new LoginService(
      new UserRepository(),
      new AuthService(jwt)
    )
    const result = await service.create(body)
    return result
  }, {
    body: LoginModel.request,
    detail: {
      summary: 'Login',
      description: 'ทางเลือกแทน Register ถ้ามีบัญชีแล้ว — เอา accessToken ไป Authorize ก่อนสร้าง Game / Package'
    },
    response: {
      200: LoginModel.response
    }
  })
