import { UserRole } from '@prisma/index'

export type OrderActor = { id: number, role: UserRole, userName?: string }

// ลูกค้าเห็นเฉพาะออเดอร์ตัวเอง, แอดมินเห็นทั้งหมด
export function orderScope (actor: OrderActor): { userId?: number } {
  return actor.role === UserRole.ADMIN ? {} : { userId: actor.id }
}

export function canAccessOrder (order: { userId: number }, actor: OrderActor): boolean {
  return actor.role === UserRole.ADMIN || order.userId === actor.id
}

export function actorLabel (actor: { id: number, userName?: string }): string {
  return actor.userName ? `${actor.userName}#${actor.id}` : `user#${actor.id}`
}
