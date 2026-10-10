import { describe, expect, it } from 'bun:test'
import {
  AOEM_PACK_LABEL,
  AOEM_PRICE_JPY,
  isAllowedAoemPack,
  isHrOtpWindow,
  isObservedSupremeCoinCard,
  parseBitcashOtp,
  reconcileAoemPayment
} from './aoem-bot.util'

describe('aoem bot', () => {
  it('allows only the 146 JPY pack inside the HR OTP window', () => {
    expect(isAllowedAoemPack(AOEM_PACK_LABEL, AOEM_PRICE_JPY)).toBe(true)
    expect(isAllowedAoemPack('99至高コイン', 146)).toBe(true)
    expect(isAllowedAoemPack(AOEM_PACK_LABEL, 456)).toBe(false)
    expect(isAllowedAoemPack('6480 Coin', 146)).toBe(false)
    expect(isHrOtpWindow(new Date('2026-10-09T05:00:00.000Z'))).toBe(true)
    expect(isHrOtpWindow(new Date('2026-10-09T09:59:00.000Z'))).toBe(true)
    expect(isHrOtpWindow(new Date('2026-10-09T10:00:00.000Z'))).toBe(false)
    expect(isHrOtpWindow(new Date('2026-10-09T04:59:00.000Z'))).toBe(false)
  })

  it('matches only the 99 + 109 card at 146円 on the shop tab', () => {
    expect(isObservedSupremeCoinCard('99 + 109 最大 110% まで 146円 150円 -2.66%')).toBe(true)
    expect(isObservedSupremeCoinCard('400 146円 150円 -2.66%')).toBe(false)
    expect(isObservedSupremeCoinCard('-2.66%')).toBe(false)
    expect(isObservedSupremeCoinCard('999 + 1099 最大 110% まで 1,455円 1,500円 -3%')).toBe(false)
    expect(isObservedSupremeCoinCard('499 + 549 最大 110% まで 698円 720円 -3.05%')).toBe(false)
  })

  it('accepts a fresh numeric OTP and rejects notes or an empty file', () => {
    expect(parseBitcashOtp('123456')).toBe('123456')
    expect(parseBitcashOtp(' 1234 ')).toBe('1234')
    expect(parseBitcashOtp('')).toBeNull()
    expect(parseBitcashOtp('otp from slide')).toBeNull()
    expect(parseBitcashOtp('12')).toBeNull()
  })

  it('completes only when Midasbuy history and the Bitcash delta both match 146 JPY', () => {
    expect(reconcileAoemPayment({
      orderNo: 'ORD-0000000000001',
      bitcashBefore: 1000,
      bitcashAfter: 854,
      invoiceAmount: 146,
      midasbuyPriceJpy: 146
    })).toEqual({ action: 'complete', orderNo: 'ORD-0000000000001' })
  })

  it('does not treat an unchanged Bitcash balance as paid', () => {
    expect(reconcileAoemPayment({
      orderNo: 'ORD-0000000000001',
      bitcashBefore: 1000,
      bitcashAfter: 1000,
      invoiceAmount: 146,
      midasbuyPriceJpy: 146
    }).action).toBe('wait')
  })

  it('waits without another payment when the balance dropped but the coins are not in history', () => {
    expect(reconcileAoemPayment({
      orderNo: 'ORD-0000000000001',
      bitcashBefore: 1000,
      bitcashAfter: 854,
      invoiceAmount: 146,
      midasbuyPriceJpy: null
    })).toEqual({ action: 'wait', reason: 'CHECK_INCOMPLETE' })
  })
})