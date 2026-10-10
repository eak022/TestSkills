import Elysia from 'elysia'
import { CreateGameHttpController } from './commands/private/create/create.controller'
import { UpdateGameHttpController } from './commands/private/update/update.controller'
import { DeleteGameHttpController } from './commands/private/delete/delete.controller'
import FindGamePaginateController from './queries/private/find-paginate/find-paginate.http.controller'
import { FindOneGameHttpController } from './queries/private/find-one/find-one.http.controller'

const GameV1Route = new Elysia({
  name: 'GameV1Route',
  prefix: '/v1/game',
  tags: ['v1', 'Game [Private]']
})
  .use(CreateGameHttpController)
  .use(UpdateGameHttpController)
  .use(DeleteGameHttpController)
  .use(FindGamePaginateController)
  .use(FindOneGameHttpController)

const GameModule = new Elysia({ name: 'GameModule' }).use(
  GameV1Route
)

export default GameModule
