import Elysia from 'elysia'
import { CommonResponseModel } from '@/libs/common/model.common'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { GameRepository } from '@/repositories/game.repository'
import { CreateGameModel } from './create.model'
import { CreateGameService } from './create.service'

export const CreateGameHttpController = new Elysia({ name: 'CreateGameHttpController' })
  .use(UserAuthGuard)
  .post('/', async ({ body }) => {
    const service = new CreateGameService(
      new GameRepository()
    )
    const result = await service.create(body)
    return result
  }, {
    body: CreateGameModel.request,
    detail: {
      summary: 'Create Game',
      description: 'ขั้นที่ 3 ของการเทสจาก DB ว่าง — ส่ง servers ด้วย (เช่น Empire#239) แล้วไป GET list/find-one เพื่อเอา gameId และ serverId'
    },
    auth: true,
    response: {
      200: CommonResponseModel
    }
  })
