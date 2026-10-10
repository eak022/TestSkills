import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export class SystemSettingRepository
  extends BaseRepository<'systemSetting', typeof prisma.systemSetting> {
  constructor () {
    super('systemSetting', prisma.systemSetting)
  }
}
