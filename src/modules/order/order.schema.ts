import { OrderStatus } from '@prisma/index'
import { t } from 'elysia'

export const OrderSchema = t.Object({
  id: t.Number(),
  orderNo: t.String(),
  status: t.Enum(OrderStatus),
  playerUid: t.String(),
  retryCount: t.Number(),
  amount: t.Number(),
  packageId: t.Number(),
  packageName: t.String(),
  gameId: t.Number(),
  gameName: t.String(),
  serverId: t.Number(),
  serverName: t.String(),
  expiresAt: t.Date(),
  createdAt: t.Date(),
  updatedAt: t.Date()
})
export type OrderSchema = typeof OrderSchema.static
