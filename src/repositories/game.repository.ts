import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export interface IGameRepository extends BaseRepository<'game', typeof prisma.game> {}

export class GameRepository
  extends BaseRepository<'game', typeof prisma.game>
  implements IGameRepository {
  constructor () {
    super('game', prisma.game)
  }
}
