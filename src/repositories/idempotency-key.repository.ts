import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export class IdempotencyKeyRepository
  extends BaseRepository<'idempotencyKey', typeof prisma.idempotencyKey> {
  constructor () {
    super('idempotencyKey', prisma.idempotencyKey)
  }
}
