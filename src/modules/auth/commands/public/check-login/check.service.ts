import { type CheckLoginModel } from './check.model'
import { type UserRepository } from '@/repositories/user.repository'
import { NotFoundError } from 'elysia'

export class CreateLoginService {
  constructor (
    private readonly userRepository: UserRepository
  ) {}

  async create (body: CheckLoginModel.request): Promise<CheckLoginModel.successResponse> {
    const userData = await this.userRepository.findFirst({
      where: {
        email: body?.email,
        deletedAt: null
      },
      select: {
        password: true
      }
    })
    if (!userData) {
      throw new NotFoundError('ไม่พบผู้ใช้')
    }

    return { isConfirm: !!userData.password }
  }
}
