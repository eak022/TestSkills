import { type CommonResponseModel } from '@/libs/common/model.common'
import { NotFoundError } from 'elysia'
import { type GameRepository } from '@/repositories/game.repository'

export class DeleteGameService {
  constructor (
    private readonly gameRepository: GameRepository
  ) {}

  async update (id: number): Promise<CommonResponseModel> {
    const game = await this.gameRepository.findFirst({
      where: {
        id,
        deletedAt: null
      }
    })
    if (!game) {
      throw new NotFoundError('ไม่พบเกม')
    }

    await this.gameRepository.softDelete({
      where: {
        id
      }
    })

    return { message: 'success' }
  }
}
