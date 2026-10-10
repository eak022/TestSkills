import { describe, expect, it } from 'bun:test'
import { OrderStatus } from '@prisma/index'
import { canTransition, statusesForTab } from './order-state-machine.util'

describe('order state machine', () => {
  it('allows the happy path', () => {
    expect(canTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.QUEUED)).toBe(true)
    expect(canTransition(OrderStatus.QUEUED, OrderStatus.IN_PROGRESS)).toBe(true)
    expect(canTransition(OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED)).toBe(true)
  })

  it('allows problem states from in-flight orders', () => {
    expect(canTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.DELAYED)).toBe(true)
    expect(canTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.EXPIRED)).toBe(true)
    expect(canTransition(OrderStatus.IN_PROGRESS, OrderStatus.DELAYED)).toBe(true)
    expect(canTransition(OrderStatus.IN_PROGRESS, OrderStatus.FAILED)).toBe(true)
    expect(canTransition(OrderStatus.FAILED, OrderStatus.REFUNDED)).toBe(true)
  })

  it('blocks skipping completed from pending payment', () => {
    expect(canTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.COMPLETED)).toBe(false)
    expect(canTransition(OrderStatus.REFUNDED, OrderStatus.QUEUED)).toBe(false)
  })

  it('splits current vs history tabs', () => {
    expect(statusesForTab('current')).toContain(OrderStatus.DELAYED)
    expect(statusesForTab('history')).toContain(OrderStatus.COMPLETED)
    expect(statusesForTab('history')).not.toContain(OrderStatus.QUEUED)
  })
})
