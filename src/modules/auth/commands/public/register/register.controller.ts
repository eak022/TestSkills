import Elysia from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { RegisterModel } from './register.model'
import { RegisterService } from './register.service'
import { UserRepository } from '@/repositories/user.repository'
import { AuthService } from '@/modules/auth/auth.service'

export const RegisterHttpController = new Elysia({ name: 'RegisterHttpController' })
  .use(jwt({
    name: 'jwt',
    secret: process.env.USER_AUTH_SECRET || 'your-secret-key'
  }))
  .post('/register', async ({ body, jwt }) => {
    const service = new RegisterService(
      new UserRepository(),
      new AuthService(jwt)
    )
    const result = await service.create(body)
    return result
  }, {
    body: RegisterModel.request,
    detail: {
      summary: 'Register',
      description: 'ขั้นที่ 1 ถ้า DB ว่าง — เก็บ accessToken ไป Authorize ก่อนสร้าง Game / Package'
    },
    response: {
      200: RegisterModel.response
    }
  })
