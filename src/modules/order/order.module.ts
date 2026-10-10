import Elysia from 'elysia'
import { ClaimOrderHttpController } from './commands/public/claim/claim.controller'
import { CreateOrderHttpController } from './commands/public/create/create.controller'
import { FixUidHttpController } from './commands/public/fix-uid/fix-uid.controller'
import { FulfillOrderHttpController } from './commands/public/fulfill/fulfill.controller'
import { OrderHeartbeatHttpController } from './commands/public/heartbeat/heartbeat.controller'
import { RefundOrderHttpController } from './commands/public/refund/refund.controller'
import { ReportIssueHttpController } from './commands/public/report-issue/report-issue.controller'
import { RunMaintenanceHttpController } from './commands/public/run-maintenance/run-maintenance.controller'
import { PaymentWebhookHttpController } from './commands/public/webhook/webhook.controller'
import { FindOneOrderHttpController } from './queries/public/find-one/find-one.http.controller'
import FindOrderPaginateController from './queries/public/find-paginate/find-paginate.http.controller'
import { OrderTimelineHttpController } from './queries/public/timeline/timeline.http.controller'

const OrderV1Route = new Elysia({
  name: 'OrderV1Route',
  prefix: '/v1/orders',
  tags: ['v1', 'Order']
})
  .use(CreateOrderHttpController)
  .use(FindOrderPaginateController)
  .use(ClaimOrderHttpController)
  .use(RunMaintenanceHttpController)
  .use(OrderTimelineHttpController)
  .use(OrderHeartbeatHttpController)
  .use(FulfillOrderHttpController)
  .use(FixUidHttpController)
  .use(RefundOrderHttpController)
  .use(ReportIssueHttpController)
  .use(FindOneOrderHttpController)

const PaymentV1Route = new Elysia({
  name: 'PaymentV1Route',
  prefix: '/v1/payments',
  tags: ['v1', 'Order']
})
  .use(PaymentWebhookHttpController)

const OrderModule = new Elysia({ name: 'OrderModule' })
  .use(OrderV1Route)
  .use(PaymentV1Route)

export default OrderModule
