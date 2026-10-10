import { type Prisma } from '@prisma/index'
import { type FindUserPaginationModel } from './find-paginate.model'
import { type UserRepository } from '@/repositories/user.repository'
export class FindPaginateUserService {
  constructor (
    private readonly userRepository: UserRepository
  ) {}

  async execute (query: FindUserPaginationModel.query): Promise<FindUserPaginationModel.successResponse> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null
    }

    if (query.search) {
      const search = query.search.trim()
      where.OR = [
        { userNo: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {}

    if (query.sortBy) {
      orderBy[query.sortBy as keyof Prisma.UserOrderByWithRelationInput]
        = query.sortOrder || 'asc'
    } else {
      orderBy.createdAt = 'desc'
    }

    const result = await this.userRepository.paginate(
      {
        where,
        orderBy,
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
      },
      {
        page: query.page || 1,
        limit: query.limit || 20
      }
    )

    const mappedData = result.data.map((data) => ({
      id: data.id,
      userNo: data.userNo ?? null,
      userName: data.userName,
      email: data.email,
      phoneNumber: data.phoneNumber ?? null,
      balance: data.balance ?? 0,
      point: data.point ?? 0,
      role: data.role
    }))

    return {
      message: 'success',
      totalPage: result.totalPage,
      page: result.page,
      limit: result.limit,
      count: result.count,
      data: mappedData
    }
  }
}
