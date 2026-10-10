import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export interface IPackageRepository extends BaseRepository<'package', typeof prisma.package> {}

export class PackageRepository
  extends BaseRepository<'package', typeof prisma.package>
  implements IPackageRepository {
  constructor () {
    super('package', prisma.package)
  }
}
