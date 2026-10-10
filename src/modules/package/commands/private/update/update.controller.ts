import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { UpdatePackageModel } from './update.model'
import { CommonResponseModel } from '@/libs/common/model.common'
import { UpdatePackageService } from './update.service'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { GameRepository } from '@/repositories/game.repository'
import { PackageRepository } from '@/repositories/package.repository'

export const UpdatePackageHttpController = new Elysia({ name: 'UpdatePackageHttpController' })
  .use(UserAuthGuard)
  .put('/:id', async ({ body, params }) => {
    const service = new UpdatePackageService(
      new PackageRepository(),
      new GameRepository()
    )
    const result = await service.update(Number(params.id), body)
    return result
  }, {
    params: UpdatePackageModel.params,
    body: UpdatePackageModel.request,
    detail: {
      security: BEARER_SECURITY,
      summary: 'Update Package',
      description: 'Update Package'
    },
    auth: true,
    response: {
      200: CommonResponseModel
    }
  })
