import { type UpdateUserModel } from './update.model'
import { type CommonResponseModel } from '@/libs/common/model.common'
import { NotFoundError } from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { prisma } from '@prisma/index'
import { type UserRepository } from '@/repositories/user.repository'

export class UpdateUserService {
  constructor (
    private readonly userRepository: UserRepository
  ) {}

  async update (
    id: number,
    body: UpdateUserModel.request
  ): Promise<CommonResponseModel> {
    const user = await this.userRepository.findFirst({
      where: {
        id,
        deletedAt: null
      }
    })
    if (!user) {
      throw new NotFoundError('ไม่พบผู้ใช้')
    }

    if (body.userName && body.userName !== user.userName) {
      const userNameExists = await this.userRepository.findFirst({
        where: {
          userName: body.userName,
          deletedAt: null,
          id: { not: id }
        }
      })
      if (userNameExists) {
        throw new BadRequestError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว')
      }
    }

    if (body.email && body.email !== user.email) {
      const emailExists = await this.userRepository.findFirst({
        where: {
          email: body.email,
          deletedAt: null,
          id: { not: id }
        }
      })
      if (emailExists) {
        throw new BadRequestError('อีเมลนี้ถูกใช้งานแล้ว')
      }
    }

    if (body.phoneNumber && body.phoneNumber !== user.phoneNumber) {
      const phoneExists = await this.userRepository.findFirst({
        where: {
          phoneNumber: body.phoneNumber,
          deletedAt: null,
          id: { not: id }
        }
      })
      if (phoneExists) {
        throw new BadRequestError('เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว')
      }
    }

    const hashedPassword = body.password
      ? await Bun.password.hash(body.password, { algorithm: 'bcrypt' })
      : undefined

    await prisma.$transaction(async (tx) => {
      await this.userRepository.update({
        where: { id },
        data: {
          userName: body.userName ?? user.userName,
          password: hashedPassword ?? user.password,
          email: body.email ?? user.email,
          phoneNumber: body.phoneNumber ?? user.phoneNumber
        }
      }, tx)
    })

    return { message: 'success' }
  }
}
