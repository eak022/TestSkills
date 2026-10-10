import { formatTwoDecimal } from '@/libs/utils/number-format-two-decimal.util'
import { type OrderSchema } from './order.schema'

type OrderRow = {
  id: number
  orderNo: string
  status: OrderSchema['status']
  playerUid: string
  retryCount: number
  amount: { toString: () => string }
  packageId: number
  gameId: number
  serverId: number
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
  package: { name: string }
  game: { name: string }
  server: { serverName: string }
}

export const orderDetailSelect = {
  id: true,
  orderNo: true,
  status: true,
  playerUid: true,
  retryCount: true,
  amount: true,
  packageId: true,
  gameId: true,
  serverId: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  package: { select: { name: true } },
  game: { select: { name: true } },
  server: { select: { serverName: true } }
} as const

export function mapOrder (data: OrderRow): OrderSchema {
  return {
    id: data.id,
    orderNo: data.orderNo,
    status: data.status,
    playerUid: data.playerUid,
    retryCount: data.retryCount,
    amount: formatTwoDecimal(data.amount.toString()),
    packageId: data.packageId,
    packageName: data.package.name,
    gameId: data.gameId,
    gameName: data.game.name,
    serverId: data.serverId,
    serverName: data.server.serverName,
    expiresAt: data.expiresAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  }
}
