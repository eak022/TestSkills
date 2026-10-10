import { describe, expect, it } from 'bun:test'
import { OrderFailureKind, OrderStatus } from '@prisma/index'
import {
  classifyTopupError,
  decideStaleClaim,
  isPaymentExpired,
  latePaidWebhookOutcome,
  MAX_CLAIM_RETRIES,
  retryBackoffMs
} from './order-ops.util'

describe('order ops', () => {
  it('classifies permanent vs transient top-up errors', () => {
    expect(classifyTopupError('UID_INVALID')).toBe(OrderFailureKind.PERMANENT)
    expect(classifyTopupError('REGION_MISMATCH')).toBe(OrderFailureKind.PERMANENT)
    expect(classifyTopupError('PROVIDER_DOWN')).toBe(OrderFailureKind.TRANSIENT)
    expect(classifyTopupError('CAPTCHA')).toBe(OrderFailureKind.TRANSIENT)
  })

  it('uses exponential backoff', () => {
    expect(retryBackoffMs(0)).toBe(30_000)
    expect(retryBackoffMs(1)).toBe(60_000)
    expect(retryBackoffMs(2)).toBe(120_000)
  })

  it('returns stale claims to queue until max retries then DELAYED', () => {
    expect(decideStaleClaim(0)).toEqual({
      nextStatus: OrderStatus.QUEUED,
      retryCount: 1,
      alertAdmin: false
    })
    expect(decideStaleClaim(MAX_CLAIM_RETRIES).alertAdmin).toBe(true)
    expect(decideStaleClaim(MAX_CLAIM_RETRIES).nextStatus).toBe(OrderStatus.DELAYED)
  })

  it('expires payment after deadline', () => {
    expect(isPaymentExpired(new Date(Date.now() - 1000))).toBe(true)
    expect(isPaymentExpired(new Date(Date.now() + 60_000))).toBe(false)
  })

  it('handles late bank webhooks without double-fulfilling', () => {
    expect(latePaidWebhookOutcome(OrderStatus.PENDING_PAYMENT)).toBe('queue')
    expect(latePaidWebhookOutcome(OrderStatus.EXPIRED)).toBe('credit')
    expect(latePaidWebhookOutcome(OrderStatus.COMPLETED)).toBe('ignore')
    expect(latePaidWebhookOutcome(OrderStatus.QUEUED)).toBe('ignore')
  })
})
