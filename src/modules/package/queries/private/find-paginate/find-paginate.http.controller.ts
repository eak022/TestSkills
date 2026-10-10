import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { FindPackagePaginationModel } from './find-paginate.model'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { FindPaginatePackageService } from './find-paginate.service'
import { PackageRepository } from '@/repositories/package.repository'

const FindPackagePaginateController = new Elysia({ name: 'FindPackagePaginateController' })
  .use(UserAuthGuard)
  .get('/', async ({ query }) => {
    const service = new FindPaginatePackageService(
      new PackageRepository()
    )
    const result = await service.execute(query)

    return result
  }, {
    detail: {
      security: BEARER_SECURITY,
      summary: 'Find Package Paginate',
      description: 'Find Package Paginate'
    },
    auth: true,
    query: FindPackagePaginationModel.query,
    response: {
      200: FindPackagePaginationModel.successResponse
    }
  })

export default FindPackagePaginateController
