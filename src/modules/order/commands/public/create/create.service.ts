import { createHash } from 'node:crypto'
import { BadRequestError, ConflictError } from '@/libs/middlewares/error-handler/domain'
import { findAndCountIncreaseWithTransaction } from '@/libs/utils/find-and-count-increase.util'
import { generateRunningNumber, ORDER_NO_DIGITS, ORDER_NO_PREFIX } from '@/libs/utils/generate-running-number.util'
import { logOrder } from '@/libs/utils/order-logger.util'
import { PAYMENT_TTL_MS } from '@/libs/utils/order-ops.util'
import { mapOrder, orderDetailSelect } from '@/modules/order/order.mapper'
import { type CreateOrderModel } from './create.model'
import { type GameServerRepository } from '@/repositories/game-server.repository'
import { type IdempotencyKeyRepository } from '@/repositories/idempotency-key.repository'
import { type OrderRepository } from '@/repositories/order.repository'
import { type OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { type PackageRepository } from '@/repositories/package.repository'
import { OrderStatus, prisma } from '@prisma/index'

function hashBody (body: CreateOrderModel.request): string {
  return createHash('sha256').update(JSON.stringify(body)).digest('hex')
}

function isUniqueViolation (error: unknown): boolean {
  return (error as { code?: string } | null)?.code === 'P2002'
}

export class CreateOrderService {
  constructor (
    private readonly orderRepository: OrderRepository,
    private readonly timelineRepository: OrderTimelineRepository,
    private readonly idempotencyKeyRepository: IdempotencyKeyRepository,
    private readonly packageRepository: PackageRepository,
    private readonly gameServerRepository: GameServerRepository
  ) {}

  async create (
    body: CreateOrderModel.request,
    idempotencyKey: string,
    userId: number
  ): Promise<CreateOrderModel.response> {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestError('ต้องส่ง header Idempotency-Key')
    }

    const requestHash = hashBody(body)

    const replayed = await this.replay(userId, idempotencyKey, requestHash)
    if (replayed) return replayed

    const pkg = await this.packageRepository.findFirst({
      where: { id: body.packageId, deletedAt: null }
    })
    if (!pkg) {
      throw new BadRequestError('ไม่พบแพ็กเกจ')
    }

    const server = await this.gameServerRepository.findFirst({
      where: { id: body.serverId }
    })
    if (!server) {
      throw new BadRequestError('ไม่พบเซิร์ฟเวอร์')
    }
    if (server.gameId !== pkg.gameId) {
      throw new BadRequestError('เซิร์ฟเวอร์ไม่ตรงกับเกมของแพ็กเกจ')
    }

    let created
    try {
      created = await prisma.$transaction(async (tx) => {
        const countTable = await findAndCountIncreaseWithTransaction('order', tx)
        const orderNo = generateRunningNumber(ORDER_NO_PREFIX, countTable.count, ORDER_NO_DIGITS)

        const order = await this.orderRepository.create({
          data: {
            orderNo,
            status: OrderStatus.PENDING_PAYMENT,
            playerUid: body.playerUid,
            amount: pkg.price,
            packageId: pkg.id,
            gameId: pkg.gameId,
            serverId: server.id,
            userId,
            expiresAt: new Date(Date.now() + PAYMENT_TTL_MS)
          },
          select: orderDetailSelect
        }, tx)

        await this.timelineRepository.create({
          data: {
            orderId: order.id,
            fromStatus: null,
            toStatus: OrderStatus.PENDING_PAYMENT,
            reason: 'Order created'
          }
        }, tx)

        await this.idempotencyKeyRepository.create({
          data: {
            userId,
            key: idempotencyKey,
            requestHash,
            orderNo: order.orderNo
          }
        }, tx)

        return order
      })
    } catch (error) {
      // ยิง key เดียวกันพร้อมกัน: ตัวที่แพ้ชน PK (userId, key) แล้ว rollback ทั้งก้อน → คืนออเดอร์ของตัวที่ชนะ
      if (isUniqueViolation(error)) {
        const winner = await this.replay(userId, idempotencyKey, requestHash)
        if (winner) return winner
      }
      throw error
    }

    const result = mapOrder(created)
    logOrder(result.orderNo, 'create_order', { status: result.status, userId })
    return result
  }

  private async replay (
    userId: number,
    idempotencyKey: string,
    requestHash: string
  ): Promise<CreateOrderModel.response | null> {
    const existing = await this.idempotencyKeyRepository.findUnique({
      where: { userId_key: { userId, key: idempotencyKey } }
    })
    if (!existing) return null

    if (existing.requestHash !== requestHash) {
      throw new ConflictError('Idempotency-Key นี้ถูกใช้กับคำขออื่นแล้ว')
    }

    const order = await this.orderRepository.findFirst({
      where: { orderNo: existing.orderNo, userId },
      select: orderDetailSelect
    })
    if (!order) {
      throw new BadRequestError('ไม่พบออเดอร์จาก Idempotency-Key นี้')
    }

    logOrder(existing.orderNo, 'create_order_idempotent_replay', { userId })
    return mapOrder(order)
  }
}
