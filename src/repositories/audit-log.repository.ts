import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export class AuditLogRepository
  extends BaseRepository<'auditLog', typeof prisma.auditLog> {
  constructor () {
    super('auditLog', prisma.auditLog)
  }
}
