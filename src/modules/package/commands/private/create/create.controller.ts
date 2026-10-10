import Elysia from 'elysia'
import { CommonResponseModel } from '@/libs/common/model.common'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { GameRepository } from '@/repositories/game.repository'
import { PackageRepository } from '@/repositories/package.repository'
import { CreatePackageModel } from './create.model'
import { CreatePackageService } from './create.service'

export const CreatePackageHttpController = new Elysia({ name: 'CreatePackageHttpController' })
  .use(UserAuthGuard)
  .post('/', async ({ body }) => {
    const service = new CreatePackageService(
      new PackageRepository(),
      new GameRepository()
    )
    const result = await service.create(body)
    return result
  }, {
    body: CreatePackageModel.request,
    detail: {
      summary: 'Create Package',
      description: 'ขั้นที่ 6 ของการเทสจาก DB ว่าง — ต้องมี gameId จาก Create Game แล้ว ค่อยเอา packageId ไปสร้างออเดอร์'
    },
    auth: true,
    response: {
      200: CommonResponseModel
    }
  })
