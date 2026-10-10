import { type CommonResponseModel } from '@/libs/common/model.common'
import { NotFoundError } from 'elysia'
import { type PackageRepository } from '@/repositories/package.repository'

export class DeletePackageService {
  constructor (
    private readonly packageRepository: PackageRepository
  ) {}

  async update (id: number): Promise<CommonResponseModel> {
    const packageData = await this.packageRepository.findFirst({
      where: {
        id,
        deletedAt: null
      }
    })
    if (!packageData) {
      throw new NotFoundError('ไม่พบแพ็กเกจ')
    }

    await this.packageRepository.softDelete({
      where: {
        id
      }
    })

    return { message: 'success' }
  }
}
