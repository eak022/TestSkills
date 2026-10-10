import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { FindGamePaginationModel } from './find-paginate.model'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { FindPaginateGameService } from './find-paginate.service'
import { GameRepository } from '@/repositories/game.repository'

const FindGamePaginateController = new Elysia({ name: 'FindGamePaginateController' })
  .use(UserAuthGuard)
  .get('/', async ({ query }) => {
    const service = new FindPaginateGameService(
      new GameRepository()
    )
    const result = await service.execute(query)

    return result
  }, {
    detail: {
      security: BEARER_SECURITY,
      summary: 'Find Game Paginate',
      description: 'Find Game Paginate'
    },
    auth: true,
    query: FindGamePaginationModel.query,
    response: {
      200: FindGamePaginationModel.successResponse
    }
  })

export default FindGamePaginateController
