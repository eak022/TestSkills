import { describe, expect, test } from 'bun:test'
import { parseWorkerConfig, pickOutcome, randomBetween } from './bot-worker.util'

describe('parseWorkerConfig', () => {
  test('requires BOT_KEY', () => {
    expect(() => parseWorkerConfig({})).toThrow('BOT_KEY')
  })

  test('defaults to simulator with no faults', () => {
    const config = parseWorkerConfig({ BOT_KEY: 'bot_x' })
    expect(config.mode).toBe('simulator')
    expect(config.fault).toBe('none')
    expect(config.apiUrl).toBe('http://localhost:3000/api/v1')
    expect(config.heartbeatMs).toBe(30000)
  })

  test('real mode needs explicit opt-in', () => {
    expect(() => parseWorkerConfig({ BOT_KEY: 'k', BOT_MODE: 'real' })).toThrow('opt-in')
    expect(parseWorkerConfig({ BOT_KEY: 'k', BOT_MODE: 'real', BOT_REAL_ENABLED: 'true' }).mode).toBe('real')
  })

  test('rejects unknown mode, fault and bad numbers', () => {
    expect(() => parseWorkerConfig({ BOT_KEY: 'k', BOT_MODE: 'x' })).toThrow('BOT_MODE')
    expect(() => parseWorkerConfig({ BOT_KEY: 'k', BOT_FAULT: 'boom' })).toThrow('BOT_FAULT')
    expect(() => parseWorkerConfig({ BOT_KEY: 'k', BOT_POLL_MS: '-1' })).toThrow('BOT_POLL_MS')
    expect(() => parseWorkerConfig({ BOT_KEY: 'k', BOT_WORK_MIN_MS: '9000', BOT_WORK_MAX_MS: '1000' })).toThrow('BOT_WORK_MIN_MS')
  })

  test('strips trailing slash from api url', () => {
    expect(parseWorkerConfig({ BOT_KEY: 'k', BOT_API_URL: 'http://h/api/v1//' }).apiUrl).toBe('http://h/api/v1')
  })
})

describe('pickOutcome', () => {
  test('fixed fault modes ignore randomness', () => {
    expect(pickOutcome('none', 0.99)).toEqual({ kind: 'success' })
    expect(pickOutcome('uid_invalid', 0)).toEqual({ kind: 'fail', errorCode: 'UID_INVALID' })
    expect(pickOutcome('provider_down', 0)).toEqual({ kind: 'fail', errorCode: 'PROVIDER_DOWN' })
    expect(pickOutcome('silent', 0)).toEqual({ kind: 'silent' })
  })

  test('random mode spreads across outcomes', () => {
    expect(pickOutcome('random', 0.1)).toEqual({ kind: 'success' })
    expect(pickOutcome('random', 0.75)).toEqual({ kind: 'fail', errorCode: 'UID_INVALID' })
    expect(pickOutcome('random', 0.85)).toEqual({ kind: 'fail', errorCode: 'PROVIDER_DOWN' })
    expect(pickOutcome('random', 0.95)).toEqual({ kind: 'silent' })
  })
})

describe('randomBetween', () => {
  test('stays within bounds', () => {
    expect(randomBetween(1000, 2000, 0)).toBe(1000)
    expect(randomBetween(1000, 2000, 0.999)).toBeLessThan(2000)
  })
})
