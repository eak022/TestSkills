import { type Prisma } from '@prisma/index'
import { formatTwoDecimal } from '@/libs/utils/number-format-two-decimal.util'
import { type FindPackagePaginationModel } from './find-paginate.model'
import { type PackageRepository } from '@/repositories/package.repository'

export class FindPaginatePackageService {
  constructor (
    private readonly packageRepository: PackageRepository
  ) {}

  async execute (query: FindPackagePaginationModel.query): Promise<FindPackagePaginationModel.successResponse> {
    const where: Prisma.PackageWhereInput = {
      deletedAt: null
    }

    if (query.search) {
      const search = query.search.trim()
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.gameId) {
      where.gameId = query.gameId
    }

    const orderBy: Prisma.PackageOrderByWithRelationInput = {}

    if (query.sortBy) {
      orderBy[query.sortBy as keyof Prisma.PackageOrderByWithRelationInput]
        = query.sortOrder || 'asc'
    } else {
      orderBy.createdAt = 'desc'
    }

    const result = await this.packageRepository.paginate(
      {
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          amount: true,
          price: true,
          status: true,
          gameId: true,
          game: {
            select: {
              name: true
            }
          }
        }
      },
      {
        page: query.page || 1,
        limit: query.limit || 20
      }
    )

    const mappedData = result.data.map((data) => ({
      id: data.id,
      name: data.name,
      amount: data.amount,
      price: formatTwoDecimal(data.price.toString()),
      status: data.status,
      gameId: data.gameId,
      gameName: data.game.name
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
