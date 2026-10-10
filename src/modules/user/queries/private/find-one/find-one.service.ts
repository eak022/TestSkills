import { NotFoundError } from 'elysia'
import { type UserRepository } from '@/repositories/user.repository'

export class FindOneUserService {
  constructor (
    private readonly userRepository: UserRepository
  ) {}

  async execute (id: number) {
    const data = await this.userRepository.findFirst({
      where: {
        id,
        deletedAt: null
      },
      select: {
        id: true,
        userNo: true,
        userName: true,
        email: true,
        phoneNumber: true,
        balance: true,
        point: true,
        role: true
      }
    })

    if (!data) {
      throw new NotFoundError('ไม่พบผู้ใช้')
    }

    return {
      id: data.id,
      userNo: data.userNo,
      userName: data.userName,
      email: data.email,
      phoneNumber: data.phoneNumber ?? null,
      balance: data.balance ?? 0,
      point: data.point ?? 0,
      role: data.role
    }
  }
}
