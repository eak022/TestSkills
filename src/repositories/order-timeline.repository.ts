import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export class OrderTimelineRepository
  extends BaseRepository<'orderTimeline', typeof prisma.orderTimeline> {
  constructor () {
    super('orderTimeline', prisma.orderTimeline)
  }
}
