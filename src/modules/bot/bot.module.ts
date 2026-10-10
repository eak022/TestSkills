import Elysia from 'elysia'
import { BotAgentHttpController, BotHttpController, KillSwitchHttpController } from './bot.controller'

const BotV1Route = new Elysia({
  name: 'BotV1Route',
  prefix: '/v1/bots',
  tags: ['v1', 'Bot']
})
  .use(BotAgentHttpController)
  .use(BotHttpController)

const SystemV1Route = new Elysia({
  name: 'SystemV1Route',
  prefix: '/v1/system',
  tags: ['v1', 'Bot']
})
  .use(KillSwitchHttpController)

const BotModule = new Elysia({ name: 'BotModule' })
  .use(BotV1Route)
  .use(SystemV1Route)

export default BotModule
