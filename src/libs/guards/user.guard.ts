import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { ForbiddenError, UnauthorizedError } from '../middlewares/error-handler/domain'
import { AuthService } from '@/modules/auth/auth.service'
import { UserRepository } from '@/repositories/user.repository'
import { UserRole } from '@prisma/index'

const userRepository = new UserRepository()

// ต้องใช้ secret เดียวกับที่ login/register เซ็น token (USER_AUTH_SECRET)
export const AUTH_JWT_SECRET
  = process.env.USER_AUTH_SECRET || process.env.JWT_SECRET || 'your-secret-key'

export type AuthUser = {
  id: number
  userName: string
  email: string
  role: UserRole
}

async function authenticate (headers: Headers, jwtInstance: any): Promise<AuthUser> {
  const authHeader = headers.get('authorization')

  if (!authHeader) {
    throw new UnauthorizedError('Missing Authorization header')
  }

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer' || !token) {
    throw new UnauthorizedError('Invalid Authorization format')
  }

  const authService = new AuthService(jwtInstance)
  const payload = await authService.verifyAccessToken(token)

  const user = await userRepository.findFirst({
    where: {
      id: payload.id,
      deletedAt: null
    },
    select: {
      id: true,
      email: true,
      userName: true,
      role: true
    }
  })

  if (!user) {
    throw new UnauthorizedError('บัญชีผู้ใช้ถูกปิดใช้งาน')
  }

  // role อ่านจาก DB ทุกครั้ง ไม่เชื่อ claim ใน token — เปลี่ยนสิทธิ์แล้วมีผลทันที
  return {
    id: user.id,
    email: user.email,
    userName: user.userName,
    role: user.role
  }
}

export const UserAuthGuard = new Elysia({ name: 'UserAuthMacro' })
  .use(jwt({
    name: 'jwt',
    secret: AUTH_JWT_SECRET
  }))
  .macro({
    auth: {
      async resolve ({ request: { headers }, jwt }) {
        return { user: await authenticate(headers, jwt) }
      }
    },
    adminAuth: {
      async resolve ({ request: { headers }, jwt }) {
        const user = await authenticate(headers, jwt)
        if (user.role !== UserRole.ADMIN) {
          throw new ForbiddenError('ต้องเป็นผู้ดูแลระบบเท่านั้น')
        }
        return { user }
      }
    }
  })
