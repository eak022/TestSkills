import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export class PaymentAttemptRepository
  extends BaseRepository<'paymentAttempt', typeof prisma.paymentAttempt> {
  constructor () {
    super('paymentAttempt', prisma.paymentAttempt)
  }
}
