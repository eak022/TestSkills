import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export class SystemAlertRepository
  extends BaseRepository<'systemAlert', typeof prisma.systemAlert> {
  constructor () {
    super('systemAlert', prisma.systemAlert)
  }
}
