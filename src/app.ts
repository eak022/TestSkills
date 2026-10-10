import { Elysia } from 'elysia'
import AppController from './app.controller'
import AppModule from './app.module'
import AppPlugin from './app.plugin'
import { ErrorHandler } from './libs/middlewares/error-handler'
import jwt from '@elysiajs/jwt'
import { ACCESS_TOKEN_EXP } from './libs/config/constant'
import { OrderJobsPlugin } from './modules/order/jobs/order-jobs.plugin'
import { DashboardController } from './modules/dashboard/dashboard.controller'

const PORT = process.env.PORT || Bun.env.PORT || 3000

const App = new Elysia({ name: 'App', serve: { idleTimeout: 60 } })

  .use(AppPlugin)
  // NOTE: this error handler is lazy loaded when use in AppPlugin will not occur
  .use(jwt({
    name: 'jwt',
    secret: process.env.USER_AUTH_SECRET!,
    exp: ACCESS_TOKEN_EXP
  }))
  .use(ErrorHandler)
  .use(AppController)
  .use(DashboardController)
  .use(AppModule)
  .use(OrderJobsPlugin)
  .listen(PORT)

export type App = typeof App

console.log(
  `🦊 Elysia is running at http://${App.server?.hostname}:${App.server?.port}`
)
