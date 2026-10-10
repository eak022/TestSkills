import { type CreateUserModel } from './create.model'
import { type CommonResponseModel } from '@/libs/common/model.common'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { findAndCountIncreaseWithTransaction } from '@/libs/utils/find-and-count-increase.util'
import { generateRunningNumber } from '@/libs/utils/generate-running-number.util'
import { type UserRepository } from '@/repositories/user.repository'
import { prisma } from '@prisma/index'

export class CreateUserService {
  constructor (
    private readonly userRepository: UserRepository
  ) {}

  async create (body: CreateUserModel.request): Promise<CommonResponseModel> {
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

    await prisma.$transaction(async (tx) => {
      const countTable = await findAndCountIncreaseWithTransaction('user', tx)
      const userNo = generateRunningNumber(`CUS-`, countTable.count, 5)

      await this.userRepository.create({
        data: {
          userNo,
          userName: body.userName,
          password: hashedPassword,
          email: body.email,
          phoneNumber: body.phoneNumber
        }
      }, tx)
    })

    return { message: 'success' }
  }
}
