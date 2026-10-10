import { type UpdateGameModel } from './update.model'
import { type CommonResponseModel } from '@/libs/common/model.common'
import { NotFoundError } from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { prisma } from '@prisma/index'
import { type GameRepository } from '@/repositories/game.repository'

export class UpdateGameService {
  constructor (
    private readonly gameRepository: GameRepository
  ) {}

  async update (
    id: number,
    body: UpdateGameModel.request
  ): Promise<CommonResponseModel> {
    const game = await this.gameRepository.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        server: true
      }
    })
    if (!game) {
      throw new NotFoundError('ไม่พบเกม')
    }

    if (body.name && body.name !== game.name) {
      const nameExists = await this.gameRepository.findFirst({
        where: {
          name: body.name,
          deletedAt: null,
          id: { not: id }
        }
      })
      if (nameExists) {
        throw new BadRequestError('ชื่อเกมนี้ถูกใช้งานแล้ว')
      }
    }

    await prisma.$transaction(async (tx) => {
      await this.gameRepository.update({
        where: { id },
        data: {
          name: body.name ?? game.name,
          status: body.status ?? game.status
        }
      }, tx)

      if (body.servers) {
        const incomingIds = body.servers
          .map((server) => server.id)
          .filter((serverId): serverId is number => typeof serverId === 'number')

        const existingIds = game.server.map((server) => server.id)
        const removeIds = existingIds.filter((serverId) => !incomingIds.includes(serverId))

        if (removeIds.length > 0) {
          await tx.gameServer.deleteMany({
            where: {
              id: { in: removeIds },
              gameId: id
            }
          })
        }

        for (const server of body.servers) {
          if (server.id) {
            if (!existingIds.includes(server.id)) {
              throw new BadRequestError('ไม่พบเซิร์ฟเวอร์ของเกมนี้')
            }
            await tx.gameServer.update({
              where: { id: server.id },
              data: { serverName: server.serverName }
            })
            continue
          }

          await tx.gameServer.create({
            data: {
              serverName: server.serverName,
              gameId: id
            }
          })
        }
      }
    })

    return { message: 'success' }
  }
}
