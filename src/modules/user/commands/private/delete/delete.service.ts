import { type CommonResponseModel } from '@/libs/common/model.common'
import { NotFoundError } from 'elysia'
import { type UserRepository } from '@/repositories/user.repository'

export class DeleteUserService {
  constructor (
    private readonly userRepository: UserRepository
  ) {}

  async update (id: number): Promise<CommonResponseModel> {
    const user = await this.userRepository.findFirst({
      where: { id }
    })
    if (!user) {
      throw new NotFoundError('ไม่พบผู้ใช้')
    }

    await this.userRepository.softDelete({
      where: {
        id
      }
    })

    return { message: 'success' }
  }
}
