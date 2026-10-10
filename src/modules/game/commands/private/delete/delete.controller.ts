import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { DeleteGameModel } from './delete.model'
import { CommonResponseModel } from '@/libs/common/model.common'
import { DeleteGameService } from './delete.service'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { GameRepository } from '@/repositories/game.repository'

export const DeleteGameHttpController = new Elysia({ name: 'DeleteGameHttpController' })
  .use(UserAuthGuard)
  .delete('/:id', async ({ params }) => {
    const service = new DeleteGameService(
      new GameRepository()
    )
    const result = await service.update(Number(params.id))
    return result
  }, {
    params: DeleteGameModel.params,
    detail: {
      security: BEARER_SECURITY,
      summary: 'Delete Game',
      description: 'Delete Game'
    },
    auth: true,
    response: {
      200: CommonResponseModel
    }
  })
