import { OrderFailureKind, OrderStatus } from '@prisma/index'

export const PAYMENT_TTL_MS = 15 * 60 * 1000
export const LEASE_MS = 2 * 60 * 1000
export const MAX_CLAIM_RETRIES = 3
export const QUEUED_SLA_MS = 10 * 60 * 1000
export const BOT_HEARTBEAT_TTL_MS = 2 * 60 * 1000
const RETRY_BASE_MS = 30 * 1000

export const PERMANENT_TOPUP_CODES = ['UID_INVALID', 'UID_BANNED', 'PACK_NOT_FOUND', 'REGION_MISMATCH', 'SELECTOR_CHANGED'] as const

export function retryBackoffMs (retryCount: number): number {
  return RETRY_BASE_MS * (2 ** Math.max(0, retryCount))
}

export function classifyTopupError (errorCode: string): OrderFailureKind {
  return (PERMANENT_TOPUP_CODES as readonly string[]).includes(errorCode)
    ? OrderFailureKind.PERMANENT
    : OrderFailureKind.TRANSIENT
}

export function decideStaleClaim (retryCount: number): { nextStatus: OrderStatus, retryCount: number, alertAdmin: boolean } {
  const nextRetry = retryCount + 1
  if (nextRetry > MAX_CLAIM_RETRIES) {
    return { nextStatus: OrderStatus.DELAYED, retryCount, alertAdmin: true }
  }
  return { nextStatus: OrderStatus.QUEUED, retryCount: nextRetry, alertAdmin: false }
}

export function isPaymentExpired (expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime()
}

export function isQueuedOverSla (createdAt: Date, now = new Date()): boolean {
  return now.getTime() - createdAt.getTime() >= QUEUED_SLA_MS
}

export function latePaidWebhookOutcome (status: OrderStatus): 'queue' | 'credit' | 'ignore' {
  if (status === OrderStatus.PENDING_PAYMENT) return 'queue'
  if (status === OrderStatus.EXPIRED) return 'credit'
  return 'ignore'
}
