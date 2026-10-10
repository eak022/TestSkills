import { describe, expect, it } from 'bun:test'
import { signWebhookPayload, verifyWebhookSignature } from './webhook-signature.util'

const secret = 'test-secret'
const rawBody = '{"orderNo":"ORD-0000000000001","status":"PAID"}'

describe('verifyWebhookSignature', () => {
  it('accepts a valid signature over the raw body', () => {
    const signature = signWebhookPayload(secret, rawBody)
    expect(verifyWebhookSignature({ secret, production: true, rawBody, signature })).toBe('ok')
  })

  it('rejects a tampered body', () => {
    const signature = signWebhookPayload(secret, rawBody)
    const result = verifyWebhookSignature({
      secret,
      production: true,
      rawBody: rawBody.replace('PAID', 'FAILED'),
      signature
    })
    expect(result).toBe('invalid')
  })

  it('rejects a missing signature when a secret is configured', () => {
    expect(verifyWebhookSignature({ secret, production: false, rawBody })).toBe('missing_signature')
  })

  it('refuses unverifiable webhooks in production but skips in dev', () => {
    expect(verifyWebhookSignature({ production: true, rawBody })).toBe('not_configured')
    expect(verifyWebhookSignature({ production: false, rawBody })).toBe('skipped')
  })

  it('binds the timestamp into the signature and rejects stale requests', () => {
    const nowMs = 1_700_000_000_000
    const fresh = String(nowMs / 1000)
    const stale = String(nowMs / 1000 - 3600)

    expect(verifyWebhookSignature({
      secret, production: true, rawBody, timestamp: fresh, nowMs,
      signature: signWebhookPayload(secret, rawBody, fresh)
    })).toBe('ok')

    expect(verifyWebhookSignature({
      secret, production: true, rawBody, timestamp: stale, nowMs,
      signature: signWebhookPayload(secret, rawBody, stale)
    })).toBe('stale')

    // เปลี่ยน timestamp แต่ใช้ signature เดิม ต้องไม่ผ่าน
    expect(verifyWebhookSignature({
      secret, production: true, rawBody, timestamp: fresh, nowMs,
      signature: signWebhookPayload(secret, rawBody, stale)
    })).toBe('invalid')
  })
})
