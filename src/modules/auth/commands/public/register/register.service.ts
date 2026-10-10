import { type RegisterModel } from './register.model'
import { REFRESH_TOKEN_EXP } from '@/libs/config/constant'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { type AuthService } from '@/modules/auth/auth.service'
import { findAndCountIncreaseWithTransaction } from '@/libs/utils/find-and-count-increase.util'
import { generateRunningNumber } from '@/libs/utils/generate-running-number.util'
import { type UserRepository } from '@/repositories/user.repository'
import { prisma } from '@prisma/index'
import { randomBytes } from 'crypto'
import dayjs from 'dayjs'
import ms from 'ms'

export class RegisterService {
  constructor (
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService
  ) {}

  async create (body: RegisterModel.request): Promise<RegisterModel.response> {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestError('รหัสผ่านไม่ตรงกัน')
    }

    const userNameExists = await this.userRepository.findFirst({
      where: {
        userName: body.userName,
        deletedAt: null
      }
    })
    if (userNameExists) {
      throw new BadRequestError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว')
    }

    const emailExists = await this.userRepository.findFirst({
      where: {
        email: body.email,
        deletedAt: null
      }
    })
    if (emailExists) {
      throw new BadRequestError('อีเมลนี้ถูกใช้งานแล้ว')
    }

    if (body.phoneNumber) {
      const phoneExists = await this.userRepository.findFirst({
        where: {
          phoneNumber: body.phoneNumber,
          deletedAt: null
        }
      })
      if (phoneExists) {
        throw new BadRequestError('เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว')
      }
    }

    const hashedPassword = await Bun.password.hash(body.password, {
      algorithm: 'bcrypt'
    })
    const refreshToken = randomBytes(64).toString('hex')
    const expiresAt = new Date(Date.now() + ms(REFRESH_TOKEN_EXP))

    const userData = await prisma.$transaction(async (tx) => {
      const countTable = await findAndCountIncreaseWithTransaction('user', tx)
      const userNo = generateRunningNumber(`CUS-`, countTable.count, 5)

      const user = await this.userRepository.create({
        data: {
          userNo,
          userName: body.userName,
          password: hashedPassword,
          email: body.email,
          phoneNumber: body.phoneNumber
        }
      }, tx)

      await tx.session.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt
        }
      })

      return user
    })

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

    return {
      accessToken: jwt,
      refreshToken,
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
