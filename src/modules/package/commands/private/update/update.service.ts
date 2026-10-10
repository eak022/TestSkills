import { type UpdatePackageModel } from './update.model'
import { type CommonResponseModel } from '@/libs/common/model.common'
import { NotFoundError } from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { prisma } from '@prisma/index'
import { type GameRepository } from '@/repositories/game.repository'
import { type PackageRepository } from '@/repositories/package.repository'

export class UpdatePackageService {
  constructor (
    private readonly packageRepository: PackageRepository,
    private readonly gameRepository: GameRepository
  ) {}

  async update (
    id: number,
    body: UpdatePackageModel.request
  ): Promise<CommonResponseModel> {
    const packageData = await this.packageRepository.findFirst({
      where: {
        id,
        deletedAt: null
      }
    })
    if (!packageData) {
      throw new NotFoundError('ไม่พบแพ็กเกจ')
    }

    const gameId = body.gameId ?? packageData.gameId
    if (body.gameId && body.gameId !== packageData.gameId) {
      const game = await this.gameRepository.findFirst({
        where: {
          id: body.gameId,
          deletedAt: null
        }
      })
      if (!game) {
        throw new BadRequestError('ไม่พบเกม')
      }
    }

    const name = body.name ?? packageData.name
    if (name !== packageData.name || gameId !== packageData.gameId) {
      const nameExists = await this.packageRepository.findFirst({
        where: {
          name,
          gameId,
          deletedAt: null,
          id: { not: id }
        }
      })
      if (nameExists) {
        throw new BadRequestError('ชื่อแพ็กเกจนี้ถูกใช้งานแล้วในเกมนี้')
      }
    }

    await prisma.$transaction(async (tx) => {
      await this.packageRepository.update({
        where: { id },
        data: {
          name,
          amount: body.amount ?? packageData.amount,
          price: body.price ?? packageData.price,
          status: body.status ?? packageData.status,
          gameId
        }
      }, tx)
    })

    return { message: 'success' }
  }
}
