import { type PasswordResetModel } from './password-reset.model'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { type UserRepository } from '@/repositories/user.repository'
import { NotFoundError } from 'elysia'

export class PasswordResetService {
  constructor (
    private readonly userRepository: UserRepository
  ) {}

  async create (body: PasswordResetModel.request): Promise<PasswordResetModel.response> {
    const { phoneNumber, newPassword, confirmPassword } = body
    if (newPassword !== confirmPassword) {
      throw new BadRequestError('รหัสผ่านไม่ตรงกัน')
    }
    const userData = await this.userRepository.findFirst({
      where: {
        phoneNumber,
        deletedAt: null
      }
    })
    if (!userData) {
      throw new NotFoundError('ไม่พบผู้ใช้')
    }

    const hashedPassword = await Bun.password.hash(newPassword, {
      algorithm: 'bcrypt',
      cost: 10
    })

    await this.userRepository.update({
      where: { id: userData.id },
      data: { password: hashedPassword }
    })

    return { message: 'success' }
  }
}
