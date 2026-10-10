import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export interface ISessionRepository extends BaseRepository<'session', typeof prisma.session> {}

export class SessionRepository
  extends BaseRepository<'session', typeof prisma.session>
  implements ISessionRepository {
  constructor () {
    super('session', prisma.session)
  }
}
