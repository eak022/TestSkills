import Elysia from 'elysia'
import { CheckLoginHttpController } from './commands/public/check-login/check.controller'
import { FirstLoginHttpController } from './commands/public/first-login/first-login.controller'
import { LoginHttpController } from './commands/public/login/login.controller'
import { RegisterHttpController } from './commands/public/register/register.controller'
import { RefreshTokenHttpController } from './commands/public/refresh-token/refresh-token.controller'
import { PasswordResetHttpController } from './commands/public/password-reset/password-reset.controller'

const AuthV1Route = new Elysia({
  name: 'AuthV1Route',
  prefix: '/v1/auth',
  tags: ['v1', 'Auth']
})
  .use(CheckLoginHttpController)
  .use(FirstLoginHttpController)
  .use(RefreshTokenHttpController)
  .use(LoginHttpController)
  .use(RegisterHttpController)
  .use(PasswordResetHttpController)

const AuthModule = new Elysia({ name: 'AuthModule' }).use(
  AuthV1Route
)

export default AuthModule
