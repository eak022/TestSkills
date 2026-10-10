import Elysia from 'elysia'
import { BotAuthGuard } from '@/libs/guards/bot.guard'
import { BOT_KEY_SECURITY } from '@/libs/docs/security'
import { KillSwitchService } from '@/modules/bot/kill-switch.service'
import { BotAgentRepository } from '@/repositories/bot-agent.repository'
import { OrderRepository } from '@/repositories/order.repository'
import { OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { SystemSettingRepository } from '@/repositories/system-setting.repository'
import { ClaimOrderModel } from './claim.model'
import { ClaimOrderService } from './claim.service'

export const ClaimOrderHttpController = new Elysia({ name: 'ClaimOrderHttpController' })
  .use(BotAuthGuard)
  .post('/claim', async ({ bot }) => {
    const service = new ClaimOrderService(
      new OrderRepository(),
      new OrderTimelineRepository(),
      new BotAgentRepository(),
      new KillSwitchService(new SystemSettingRepository())
    )
    return await service.execute(bot.id)
  }, {
    botAuth: true,
    detail: {
      summary: 'Claim next queued order (bot)',
      description: 'เฉพาะบอท — ส่ง header x-bot-key (botId ได้จากคีย์) Atomic claim ด้วย FOR UPDATE SKIP LOCKED บอทสองตัวแย่งออเดอร์เดียวกันไม่ได้ kill-switch เปิดอยู่ = 409',
      security: BOT_KEY_SECURITY
    },
    response: {
      200: ClaimOrderModel.response
    }
  })
