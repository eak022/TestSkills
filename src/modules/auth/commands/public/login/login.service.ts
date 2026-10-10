import { NotFoundError } from 'elysia'
import { REFRESH_TOKEN_EXP } from '@/libs/config/constant'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { type AuthService } from '@/modules/auth/auth.service'
import { type UserRepository } from '@/repositories/user.repository'
import { prisma } from '@prisma/index'
import { type LoginModel } from './login.model'
import { randomBytes } from 'crypto'
import dayjs from 'dayjs'
import ms from 'ms'

export class LoginService {
  constructor (
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService
  ) {}

  async create (body: LoginModel.request): Promise<LoginModel.response> {
    const userData = await this.userRepository.findFirst({
      where: {
        email: body?.email,
        deletedAt: null
      },
      select: {
        id: true,
        password: true,
        userName: true,
        email: true,
        balance: true,
        phoneNumber: true,
        point: true,
        deletedAt: true
      }
    })
    if (!userData) {
      throw new NotFoundError('ไม่พบผู้ใช้')
    }
    if (userData.deletedAt !== null) {
      throw new BadRequestError('ผู้ใช้บริการถูกปิดใช้งาน')
    }

    const matchPassword = await Bun.password.verify(
      body.password,
      userData?.password ?? '',
      'bcrypt'
    )

    if (!matchPassword) {
      throw new BadRequestError(
        'รหัสผ่านไม่ถูกต้อง'
      )
    }
    const payload = {
      id: userData?.id,
      userName: userData?.userName,
      email: userData?.email,
      balance: userData?.balance,
      phoneNumber: userData?.phoneNumber,
      point: userData?.point

    }

    const refreshToken = randomBytes(64).toString('hex')
    const expiresAt = new Date(Date.now() + ms(REFRESH_TOKEN_EXP))

    await prisma.$transaction(async (tx: any) => {
      await tx.session.deleteMany({
        where: { userId: userData.id }
      })

      await tx.session.create({
        data: {
          userId: userData.id,
          refreshToken,
          expiresAt
        }
      })
    })

    const jwt = await this.authService.signAccessToken({
      ...payload
    })

    return {
      accessToken: jwt,
      refreshToken: refreshToken,
      expireIn: dayjs(jwt.exp).valueOf(),
      user: {
        id: payload.id,
        userName: payload.userName ?? '',
        email: payload.email ?? '',
        balance: payload.balance ?? 0,
        phoneNumber: payload.phoneNumber ?? '',
        point: payload.point ?? 0
      }
    }
  }
}
