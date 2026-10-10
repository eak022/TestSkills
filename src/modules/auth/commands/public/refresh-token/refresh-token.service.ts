import { type RefreshModel } from './refresh-token.model'
import { UnauthorizedError } from '@/libs/middlewares/error-handler/domain'
import { type UserRepository } from '@/repositories/user.repository'
import { type AuthService } from '@/modules/auth/auth.service'
import { NotFoundError } from 'elysia'
import { type SessionRepository } from '@/repositories/session.repository'

export class LoginService {
  constructor (
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
    private readonly sessionRepository: SessionRepository
  ) {}

  async create (body: RefreshModel.request): Promise<RefreshModel.response> {
    const sessionData = await this.sessionRepository.findFirst({
      where: {
        refreshToken: body?.refreshToken
      }
    })
    if (!sessionData) {
      throw new UnauthorizedError('ไม่พบข้อมูล')
    }
    if (sessionData.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token หมดอายุ')
    }

    const userData = await this.userRepository.findFirst({
      where: {
        id: sessionData.userId,
        deletedAt: null
      },
      select: {
        id: true,
        userName: true,
        email: true,
        balance: true,
        phoneNumber: true,
        point: true
      }
    })

    if (!userData) {
      throw new NotFoundError('ไม่พบผู้ใช้')
    }
    const payload = {
      id: userData.id,
      userName: userData.userName,
      email: userData.email,
      balance: userData.balance,
      phoneNumber: userData.phoneNumber,
      point: userData.point
    }

    const jwt = await this.authService.signAccessToken({
      ...payload
    })

    return { accessToken: jwt }
  }
}
