import { describe, expect, it } from 'bun:test'
import { BOT_API_KEY_PREFIX, generateBotApiKey, hashApiKey, safeEqual } from './api-key.util'

describe('bot api key', () => {
  it('generates unique prefixed keys', () => {
    const a = generateBotApiKey()
    const b = generateBotApiKey()
    expect(a.startsWith(BOT_API_KEY_PREFIX)).toBe(true)
    expect(a).not.toBe(b)
    expect(a.length).toBe(BOT_API_KEY_PREFIX.length + 64)
  })

  it('stores only a deterministic hash, never the key', () => {
    const key = generateBotApiKey()
    expect(hashApiKey(key)).toBe(hashApiKey(key))
    expect(hashApiKey(key)).not.toContain(key)
    expect(hashApiKey(key)).not.toBe(hashApiKey(generateBotApiKey()))
  })

  it('compares in constant-time style and rejects length mismatch', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
  })
})
