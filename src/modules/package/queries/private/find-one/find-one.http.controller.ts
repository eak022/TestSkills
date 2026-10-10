import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { FindOnePackageModel } from './find-one.model'
import { FindOnePackageService } from './find-one.service'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { PackageRepository } from '@/repositories/package.repository'

export const FindOnePackageHttpController = new Elysia({ name: 'FindOnePackageHttpController' })
  .use(UserAuthGuard)
  .get('/:id', async ({ params }) => {
    const service = new FindOnePackageService(
      new PackageRepository()
    )
    const result = await service.execute(Number(params.id))
    return result
  }, {
    params: FindOnePackageModel.params,
    detail: {
      security: BEARER_SECURITY,
      summary: 'Find One Package',
      description: 'Find One Package'
    },
    auth: true,
    response: {
      200: FindOnePackageModel.response
    }
  })
