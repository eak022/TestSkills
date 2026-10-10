import Elysia from 'elysia'
import { OrderAnimoHttpController } from './commands/public/order/order.controller'
import { QuoteAnimoHttpController } from './commands/public/quote/quote.controller'
import { VerifyAnimoHttpController } from './commands/public/verify/verify.controller'

const AnimoV1Route = new Elysia({
  name: 'AnimoV1Route',
  prefix: '/v1/animo',
  tags: ['v1', 'Animo']
})
  .use(VerifyAnimoHttpController)
  .use(QuoteAnimoHttpController)
  .use(OrderAnimoHttpController)

const AnimoModule = new Elysia({ name: 'AnimoModule' }).use(
  AnimoV1Route
)

export default AnimoModule
