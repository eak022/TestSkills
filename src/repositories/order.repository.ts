import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export class OrderRepository
  extends BaseRepository<'order', typeof prisma.order> {
  constructor () {
    super('order', prisma.order)
  }
}
