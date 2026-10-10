import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { FindOneGameModel } from './find-one.model'
import { FindOneGameService } from './find-one.service'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { GameRepository } from '@/repositories/game.repository'

export const FindOneGameHttpController = new Elysia({ name: 'FindOneGameHttpController' })
  .use(UserAuthGuard)
  .get('/:id', async ({ params }) => {
    const service = new FindOneGameService(
      new GameRepository()
    )
    const result = await service.execute(Number(params.id))
    return result
  }, {
    params: FindOneGameModel.params,
    detail: {
      security: BEARER_SECURITY,
      summary: 'Find One Game',
      description: 'Find One Game'
    },
    auth: true,
    response: {
      200: FindOneGameModel.response
    }
  })
