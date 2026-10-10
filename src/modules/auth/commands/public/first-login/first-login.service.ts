import { type FirstLoginModel } from './first-login.model'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { type UserRepository } from '@/repositories/user.repository'
import { type AuthService } from '@/modules/auth/auth.service'
import { NotFoundError } from 'elysia'
import { randomBytes } from 'crypto'
import dayjs from 'dayjs'
import { prisma } from '@prisma/index'
import { REFRESH_TOKEN_EXP } from '@/libs/config/constant'
import ms from 'ms'

export class CreateLoginService {
  constructor (
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService
  ) {}

  async create (body: FirstLoginModel.request): Promise<FirstLoginModel.response> {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestError('รหัสผ่านไม่ตรงกัน')
    }
    const userData = await this.userRepository.findFirst({
      where: {
        email: body?.email,
        deletedAt: null,
        password: null
      },
      select: {
        id: true,
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
    const hashedPassword = await Bun.password.hash(body.password, {
      algorithm: 'bcrypt',
      cost: 10
    })
    const payload = {
      id: userData.id,
      userName: userData.userName,
      email: userData.email,
      balance: userData.balance,
      phoneNumber: userData.phoneNumber,
      point: userData.point
    }
    const refreshToken = randomBytes(64).toString('hex')
    const expiresAt = new Date(Date.now() + ms(REFRESH_TOKEN_EXP))
    await prisma.$transaction(async (tx) => {
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
      await tx.user.update({
        where: { id: userData.id },
        data: { password: hashedPassword }
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
