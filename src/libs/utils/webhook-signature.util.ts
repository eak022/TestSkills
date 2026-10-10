import { createHmac } from 'node:crypto'
import { safeEqual } from './api-key.util'

export const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000

export type WebhookVerification
  = | 'ok'
    | 'skipped'
    | 'not_configured'
    | 'missing_signature'
    | 'stale'
    | 'invalid'

// ถ้ามี timestamp จะเซ็นบน `${timestamp}.${rawBody}` (timestamp เป็นวินาที) ไม่มีก็เซ็นบน rawBody
export function signWebhookPayload (secret: string, rawBody: string, timestamp?: string): string {
  const signed = timestamp ? `${timestamp}.${rawBody}` : rawBody
  return createHmac('sha256', secret).update(signed).digest('hex')
}

export function verifyWebhookSignature (input: {
  secret?: string
  production: boolean
  rawBody: string
  signature?: string
  timestamp?: string
  nowMs?: number
  toleranceMs?: number
}): WebhookVerification {
  if (!input.secret) {
    // production ห้ามรับ webhook ที่ตรวจไม่ได้ — dev ข้ามได้เพื่อทดสอบ
    return input.production ? 'not_configured' : 'skipped'
  }
  if (!input.signature) return 'missing_signature'

  if (input.timestamp) {
    const seconds = Number(input.timestamp)
    if (!Number.isFinite(seconds)) return 'invalid'
    const now = input.nowMs ?? Date.now()
    if (Math.abs(now - seconds * 1000) > (input.toleranceMs ?? WEBHOOK_TIMESTAMP_TOLERANCE_MS)) {
      return 'stale'
    }
  }

  const expected = signWebhookPayload(input.secret, input.rawBody, input.timestamp)
  return safeEqual(expected, input.signature) ? 'ok' : 'invalid'
}
