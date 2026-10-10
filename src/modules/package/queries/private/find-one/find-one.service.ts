import { NotFoundError } from 'elysia'
import { formatTwoDecimal } from '@/libs/utils/number-format-two-decimal.util'
import { type PackageRepository } from '@/repositories/package.repository'

export class FindOnePackageService {
  constructor (
    private readonly packageRepository: PackageRepository
  ) {}

  async execute (id: number) {
    const data = await this.packageRepository.findFirst({
      where: {
        id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        amount: true,
        price: true,
        status: true,
        gameId: true,
        game: {
          select: {
            name: true
          }
        }
      }
    })

    if (!data) {
      throw new NotFoundError('ไม่พบแพ็กเกจ')
    }

    return {
      id: data.id,
      name: data.name,
      amount: data.amount,
      price: formatTwoDecimal(data.price.toString()),
      status: data.status,
      gameId: data.gameId,
      gameName: data.game.name
    }
  }
}
