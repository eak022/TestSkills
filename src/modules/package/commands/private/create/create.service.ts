import { type CreatePackageModel } from './create.model'
import { type CommonResponseModel } from '@/libs/common/model.common'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { type GameRepository } from '@/repositories/game.repository'
import { type PackageRepository } from '@/repositories/package.repository'
import { prisma } from '@prisma/index'

export class CreatePackageService {
  constructor (
    private readonly packageRepository: PackageRepository,
    private readonly gameRepository: GameRepository
  ) {}

  async create (body: CreatePackageModel.request): Promise<CommonResponseModel> {
    const game = await this.gameRepository.findFirst({
      where: {
        id: body.gameId,
        deletedAt: null
      }
    })
    if (!game) {
      throw new BadRequestError('ไม่พบเกม')
    }

    const nameExists = await this.packageRepository.findFirst({
      where: {
        name: body.name,
        gameId: body.gameId,
        deletedAt: null
      }
    })
    if (nameExists) {
      throw new BadRequestError('ชื่อแพ็กเกจนี้ถูกใช้งานแล้วในเกมนี้')
    }

    await prisma.$transaction(async (tx) => {
      await this.packageRepository.create({
        data: {
          name: body.name,
          amount: body.amount,
          price: body.price,
          status: body.status,
          gameId: body.gameId
        }
      }, tx)
    })

    return { message: 'success' }
  }
}
