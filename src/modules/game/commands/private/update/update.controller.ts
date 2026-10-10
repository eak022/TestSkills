import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { UpdateGameModel } from './update.model'
import { CommonResponseModel } from '@/libs/common/model.common'
import { UpdateGameService } from './update.service'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { GameRepository } from '@/repositories/game.repository'

export const UpdateGameHttpController = new Elysia({ name: 'UpdateGameHttpController' })
  .use(UserAuthGuard)
  .put('/:id', async ({ body, params }) => {
    const service = new UpdateGameService(
      new GameRepository()
    )
    const result = await service.update(Number(params.id), body)
    return result
  }, {
    params: UpdateGameModel.params,
    body: UpdateGameModel.request,
    detail: {
      security: BEARER_SECURITY,
      summary: 'Update Game',
      description: 'Update Game'
    },
    auth: true,
    response: {
      200: CommonResponseModel
    }
  })
