import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { DeletePackageModel } from './delete.model'
import { CommonResponseModel } from '@/libs/common/model.common'
import { DeletePackageService } from './delete.service'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { PackageRepository } from '@/repositories/package.repository'

export const DeletePackageHttpController = new Elysia({ name: 'DeletePackageHttpController' })
  .use(UserAuthGuard)
  .delete('/:id', async ({ params }) => {
    const service = new DeletePackageService(
      new PackageRepository()
    )
    const result = await service.update(Number(params.id))
    return result
  }, {
    params: DeletePackageModel.params,
    detail: {
      security: BEARER_SECURITY,
      summary: 'Delete Package',
      description: 'Delete Package'
    },
    auth: true,
    response: {
      200: CommonResponseModel
    }
  })
