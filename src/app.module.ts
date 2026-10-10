import Elysia from 'elysia'
import AuthModule from './modules/auth/auth.module'
import UserModule from './modules/user/user.module'
import GameModule from './modules/game/game.module'
import PackageModule from './modules/package/package.module'
import OrderModule from './modules/order/order.module'
import BotModule from './modules/bot/bot.module'
import AnimoModule from './modules/animo/animo.module'

const AppModule = new Elysia({ name: 'AppModule', prefix: '/api' })

  // Auth
  .use(AuthModule)

// User
  .use(UserModule)

  // Game
  .use(GameModule)

  // Package
  .use(PackageModule)

  // Order
  .use(OrderModule)

  // Bot monitor
  .use(BotModule)

  // Aniimo UID verify (โจทย์ที่ 2)
  .use(AnimoModule)

export default AppModule
