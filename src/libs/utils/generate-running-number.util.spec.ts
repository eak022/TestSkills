import { describe, expect, it } from 'bun:test'
import {
  generateRunningNumber,
  isValidOrderNo,
  ORDER_NO_DIGITS,
  ORDER_NO_PREFIX
} from './generate-running-number.util'

describe('generateRunningNumber for orders', () => {
  it('uses the same running-number helper as userNo', () => {
    const orderNo = generateRunningNumber(ORDER_NO_PREFIX, 1, ORDER_NO_DIGITS)
    expect(orderNo).toBe('ORD-0000000000001')
    expect(isValidOrderNo(orderNo)).toBe(true)
  })

  it('accepts a 13-digit ORD number like the assignment example body', () => {
    expect(isValidOrderNo('ORD-2587965432159')).toBe(true)
  })

  it('rejects invalid formats', () => {
    expect(isValidOrderNo('ORD-123')).toBe(false)
    expect(isValidOrderNo('ord-0000000000001')).toBe(false)
    expect(isValidOrderNo('ORD-2587965432159-458')).toBe(false)
  })
})
