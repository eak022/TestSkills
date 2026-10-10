import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export class BotCommandRepository
  extends BaseRepository<'botCommand', typeof prisma.botCommand> {
  constructor () {
    super('botCommand', prisma.botCommand)
  }
}
