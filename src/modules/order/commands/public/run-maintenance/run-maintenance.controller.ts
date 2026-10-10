import Elysia from 'elysia'
import { UserAuthGuard } from '@/libs/guards/user.guard'
import { BEARER_SECURITY } from '@/libs/docs/security'
import { BotAgentRepository } from '@/repositories/bot-agent.repository'
import { OrderRepository } from '@/repositories/order.repository'
import { OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { SystemAlertRepository } from '@/repositories/system-alert.repository'
import { OrderMaintenanceService } from '@/modules/order/jobs/order-maintenance.service'

export const RunMaintenanceHttpController = new Elysia({ name: 'RunMaintenanceHttpController' })
  .use(UserAuthGuard)
  .post('/maintenance/run', async () => {
    const service = new OrderMaintenanceService(
      new OrderRepository(),
      new OrderTimelineRepository(),
      new SystemAlertRepository(),
      new BotAgentRepository()
    )
    return await service.run()
  }, {
    adminAuth: true,
    detail: {
      summary: 'Run order maintenance now (admin)',
      security: BEARER_SECURITY,
      description: 'เฉพาะแอดมิน — Idempotent: expire PENDING_PAYMENT, reclaim silent claims, alert QUEUED เกิน SLA'
    }
  })
