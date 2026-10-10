import Elysia from 'elysia'
import { BotAuthGuard } from '@/libs/guards/bot.guard'
import { BOT_KEY_SECURITY } from '@/libs/docs/security'
import { BotAgentRepository } from '@/repositories/bot-agent.repository'
import { OrderRepository } from '@/repositories/order.repository'
import { OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { FulfillOrderModel } from './fulfill.model'
import { FulfillOrderService } from './fulfill.service'

export const FulfillOrderHttpController = new Elysia({ name: 'FulfillOrderHttpController' })
  .use(BotAuthGuard)
  .post('/:orderNo/fulfill', async ({ params, body, bot }) => {
    const service = new FulfillOrderService(
      new OrderRepository(),
      new OrderTimelineRepository(),
      new BotAgentRepository()
    )
    return await service.execute(params.orderNo, body, bot.id)
  }, {
    botAuth: true,
    params: FulfillOrderModel.params,
    body: FulfillOrderModel.request,
    detail: {
      summary: 'Report top-up result (bot)',
      description: 'เฉพาะบอทที่ claim ออเดอร์นี้ (x-bot-key) — SUCCESS → COMPLETED, UID_INVALID → FAILED ทันที, PROVIDER_DOWN → retry แล้ว DELAYED ถ้าเกิน 3 ครั้ง',
      security: BOT_KEY_SECURITY
    },
    response: {
      200: FulfillOrderModel.response
    }
  })
