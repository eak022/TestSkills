import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export class GameServerRepository
  extends BaseRepository<'gameServer', typeof prisma.gameServer> {
  constructor () {
    super('gameServer', prisma.gameServer)
  }
}
