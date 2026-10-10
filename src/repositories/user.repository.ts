import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export interface IUserRepository extends BaseRepository<'user', typeof prisma.user> {}

export class UserRepository
  extends BaseRepository<'user', typeof prisma.user>
  implements IUserRepository {
  constructor () {
    super('user', prisma.user)
  }
}
