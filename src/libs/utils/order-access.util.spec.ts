import { describe, expect, it } from 'bun:test'
import { UserRole } from '@prisma/index'
import { actorLabel, canAccessOrder, orderScope } from './order-access.util'

describe('order access', () => {
  const customer = { id: 7, role: UserRole.CUSTOMER }
  const admin = { id: 1, role: UserRole.ADMIN }

  it('scopes customers to their own orders only', () => {
    expect(orderScope(customer)).toEqual({ userId: 7 })
    expect(canAccessOrder({ userId: 7 }, customer)).toBe(true)
    expect(canAccessOrder({ userId: 8 }, customer)).toBe(false)
  })

  it('lets admins see every order', () => {
    expect(orderScope(admin)).toEqual({})
    expect(canAccessOrder({ userId: 8 }, admin)).toBe(true)
  })

  it('labels the actor for audit/timeline reasons', () => {
    expect(actorLabel({ id: 1, userName: 'root' })).toBe('root#1')
    expect(actorLabel({ id: 2 })).toBe('user#2')
  })
})
