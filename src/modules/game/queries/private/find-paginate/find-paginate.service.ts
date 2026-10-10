import { type Prisma } from '@prisma/index'
import { type FindGamePaginationModel } from './find-paginate.model'
import { type GameRepository } from '@/repositories/game.repository'

export class FindPaginateGameService {
  constructor (
    private readonly gameRepository: GameRepository
  ) {}

  async execute (query: FindGamePaginationModel.query): Promise<FindGamePaginationModel.successResponse> {
    const where: Prisma.GameWhereInput = {
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

    const orderBy: Prisma.GameOrderByWithRelationInput = {}

    if (query.sortBy) {
      orderBy[query.sortBy as keyof Prisma.GameOrderByWithRelationInput]
        = query.sortOrder || 'asc'
    } else {
      orderBy.createdAt = 'desc'
    }

    const result = await this.gameRepository.paginate(
      {
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          status: true
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
      status: data.status
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
