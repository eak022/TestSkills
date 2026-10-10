import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export class AniimoOrderRepository
  extends BaseRepository<'aniimoOrder', typeof prisma.aniimoOrder> {
  constructor () {
    super('aniimoOrder', prisma.aniimoOrder)
  }
}
