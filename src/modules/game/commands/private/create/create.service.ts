import { type CreateGameModel } from './create.model'
import { type CommonResponseModel } from '@/libs/common/model.common'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { type GameRepository } from '@/repositories/game.repository'
import { prisma } from '@prisma/index'

export class CreateGameService {
  constructor (
    private readonly gameRepository: GameRepository
  ) {}

  async create (body: CreateGameModel.request): Promise<CommonResponseModel> {
    const nameExists = await this.gameRepository.findFirst({
      where: {
        name: body.name,
        deletedAt: null
      }
    })
    if (nameExists) {
      throw new BadRequestError('ชื่อเกมนี้ถูกใช้งานแล้ว')
    }

    await prisma.$transaction(async (tx) => {
      await this.gameRepository.create({
        data: {
          name: body.name,
          status: body.status,
          server: body.servers?.length
            ? {
                create: body.servers.map((server) => ({
                  serverName: server.serverName
                }))
              }
            : undefined
        }
      }, tx)
    })

    return { message: 'success' }
  }
}
