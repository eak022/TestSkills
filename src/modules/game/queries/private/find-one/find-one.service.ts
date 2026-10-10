import { NotFoundError } from 'elysia'
import { type GameRepository } from '@/repositories/game.repository'

export class FindOneGameService {
  constructor (
    private readonly gameRepository: GameRepository
  ) {}

  async execute (id: number) {
    const data = await this.gameRepository.findFirst({
      where: {
        id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        status: true,
        server: {
          select: {
            id: true,
            serverName: true
          }
        }
      }
    })

    if (!data) {
      throw new NotFoundError('ไม่พบเกม')
    }

    return {
      id: data.id,
      name: data.name,
      status: data.status,
      servers: data.server
    }
  }
}
