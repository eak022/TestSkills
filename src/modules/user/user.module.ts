import Elysia from 'elysia'
import { CreateUserHttpController } from './commands/private/create/create.controller'
import { UpdateUserHttpController } from './commands/private/update/update.controller'
import { DeleteUserHttpController } from './commands/private/delete/delete.controller'
import FindUserPaginateController from './queries/private/find-paginate/find-paginate.http.controller'
import { FindOneUserHttpController } from './queries/private/find-one/find-one.http.controller'

const UserV1Route = new Elysia({
  name: 'UserV1Route',
  prefix: '/v1/user',
  tags: ['v1', 'User [Private]']
})
  .use(CreateUserHttpController)
  .use(UpdateUserHttpController)
  .use(DeleteUserHttpController)

  .use(FindUserPaginateController)
  .use(FindOneUserHttpController)

const UserModule = new Elysia({ name: 'UserModule' }).use(
  UserV1Route
)

export default UserModule
