import Elysia from 'elysia'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { BEARER_SECURITY } from '@/libs/docs/security'
import { GameServerRepository } from '@/repositories/game-server.repository'
import { IdempotencyKeyRepository } from '@/repositories/idempotency-key.repository'
import { OrderRepository } from '@/repositories/order.repository'
import { OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { PackageRepository } from '@/repositories/package.repository'
import { CreateOrderModel } from './create.model'
import { CreateOrderService } from './create.service'

export const CreateOrderHttpController = new Elysia({ name: 'CreateOrderHttpController' })
  .use(UserAuthGuard)
  .post('/', async ({ body, headers, user }) => {
    const service = new CreateOrderService(
      new OrderRepository(),
      new OrderTimelineRepository(),
      new IdempotencyKeyRepository(),
      new PackageRepository(),
      new GameServerRepository()
    )
    return await service.create(body, headers['idempotency-key'], user.id)
  }, {
    auth: true,
    headers: CreateOrderModel.headers,
    body: CreateOrderModel.request,
    detail: {
      summary: 'Create Order',
      description: [
        'ต้อง login (Bearer) — ออเดอร์ผูกกับผู้ใช้จาก token',
        'อย่าเริ่มที่นี่ถ้า DB ว่าง — ต้องมี Game (พร้อม server) และ Package ก่อน ดูลำดับที่หัว OpenAPI',
        'Header Idempotency-Key: ฝั่ง client สร้างเอง (UUID / nanoid) ส่งมาทุกครั้งที่สร้างออเดอร์ key ผูกกับผู้ใช้',
        'key เดิม + body เดิม = คืนออเดอร์เดิม, key เดิม + body ต่าง = 409'
      ].join('\n'),
      security: BEARER_SECURITY
    },
    response: {
      200: CreateOrderModel.response
    }
  })
