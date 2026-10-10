import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export class WebhookEventRepository
  extends BaseRepository<'webhookEvent', typeof prisma.webhookEvent> {
  constructor () {
    super('webhookEvent', prisma.webhookEvent)
  }
}
