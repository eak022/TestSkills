import Elysia from 'elysia'
import { CreatePackageHttpController } from './commands/private/create/create.controller'
import { UpdatePackageHttpController } from './commands/private/update/update.controller'
import { DeletePackageHttpController } from './commands/private/delete/delete.controller'
import FindPackagePaginateController from './queries/private/find-paginate/find-paginate.http.controller'
import { FindOnePackageHttpController } from './queries/private/find-one/find-one.http.controller'

const PackageV1Route = new Elysia({
  name: 'PackageV1Route',
  prefix: '/v1/package',
  tags: ['v1', 'Package [Private]']
})
  .use(CreatePackageHttpController)
  .use(UpdatePackageHttpController)
  .use(DeletePackageHttpController)
  .use(FindPackagePaginateController)
  .use(FindOnePackageHttpController)

const PackageModule = new Elysia({ name: 'PackageModule' }).use(
  PackageV1Route
)

export default PackageModule
