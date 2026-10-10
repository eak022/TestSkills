import Elysia from 'elysia'
import { BotAuthGuard } from '@/libs/guards/bot.guard'
import { BOT_KEY_SECURITY } from '@/libs/docs/security'
import { BotAgentRepository } from '@/repositories/bot-agent.repository'
import { OrderRepository } from '@/repositories/order.repository'
import { OrderHeartbeatModel } from './heartbeat.model'
import { OrderHeartbeatService } from './heartbeat.service'

export const OrderHeartbeatHttpController = new Elysia({ name: 'OrderHeartbeatHttpController' })
  .use(BotAuthGuard)
  .post('/:orderNo/heartbeat', async ({ params, bot }) => {
    const service = new OrderHeartbeatService(new OrderRepository(), new BotAgentRepository())
    return await service.execute(params.orderNo, bot.id)
  }, {
    botAuth: true,
    params: OrderHeartbeatModel.params,
    detail: {
      summary: 'Order heartbeat (bot)',
      description: 'เฉพาะบอทที่ claim ออเดอร์นี้ (x-bot-key) — ต่อ lease ถ้าเงียบเกินเวลา job จะคืนคิว / DELAYED',
      security: BOT_KEY_SECURITY
    },
    response: {
      200: OrderHeartbeatModel.response
    }
  })
