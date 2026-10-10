import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export class BotAgentRepository
  extends BaseRepository<'botAgent', typeof prisma.botAgent> {
  constructor () {
    super('botAgent', prisma.botAgent)
  }
}
