import { OrderStatus } from '@prisma/index'

export const CURRENT_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.QUEUED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.DELAYED
]

export const HISTORY_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.FAILED,
  OrderStatus.EXPIRED,
  OrderStatus.REFUNDED
]

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.QUEUED, OrderStatus.EXPIRED, OrderStatus.FAILED, OrderStatus.DELAYED],
  [OrderStatus.QUEUED]: [OrderStatus.IN_PROGRESS, OrderStatus.DELAYED, OrderStatus.FAILED, OrderStatus.EXPIRED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.DELAYED, OrderStatus.FAILED, OrderStatus.QUEUED],
  [OrderStatus.DELAYED]: [OrderStatus.QUEUED, OrderStatus.IN_PROGRESS, OrderStatus.FAILED, OrderStatus.REFUNDED],
  [OrderStatus.FAILED]: [OrderStatus.QUEUED, OrderStatus.REFUNDED],
  [OrderStatus.EXPIRED]: [OrderStatus.QUEUED, OrderStatus.REFUNDED],
  [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: []
}

export function canTransition (from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

export function assertTransition (from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid order transition: ${from} → ${to}`)
  }
}

export function isCurrentTabStatus (status: OrderStatus): boolean {
  return CURRENT_ORDER_STATUSES.includes(status)
}

export function statusesForTab (tab: 'current' | 'history'): OrderStatus[] {
  return tab === 'history' ? HISTORY_ORDER_STATUSES : CURRENT_ORDER_STATUSES
}
