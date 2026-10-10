import { cron } from '@elysiajs/cron'
import Elysia from 'elysia'
import { BotAgentRepository } from '@/repositories/bot-agent.repository'
import { OrderRepository } from '@/repositories/order.repository'
import { OrderTimelineRepository } from '@/repositories/order-timeline.repository'
import { SystemAlertRepository } from '@/repositories/system-alert.repository'
import { OrderMaintenanceService } from './order-maintenance.service'

export const OrderJobsPlugin = new Elysia({ name: 'OrderJobsPlugin' })
  .use(cron({
    name: 'order-maintenance',
    pattern: '* * * * *',
    async run () {
      const service = new OrderMaintenanceService(
        new OrderRepository(),
        new OrderTimelineRepository(),
        new SystemAlertRepository(),
        new BotAgentRepository()
      )
      const result = await service.run()
      console.log(JSON.stringify({ job: 'order-maintenance', ...result, at: new Date().toISOString() }))
    }
  }))
