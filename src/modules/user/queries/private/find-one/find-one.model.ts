import { UserRole } from '@prisma/index'
import { t } from 'elysia'

export namespace FindOneUserModel {
  export const params = t.Object({
    id: t.Number({ example: 1, description: 'The user ID — ได้จาก GET /user?page=1' })
  })
  export type params = typeof params.static

  export const UserSchema = t.Object({
    id: t.Number(),
    userNo: t.String(),
    userName: t.String(),
    email: t.String(),
    phoneNumber: t.Optional(t.Union([t.String({ example: '0-2222-3333' }), t.Null()])),
    balance: t.Number(),
    point: t.Number(),
    role: t.Enum(UserRole, { example: 'CUSTOMER', description: 'CUSTOMER | ADMIN' })
  })

  export const response = t.Composite([
    UserSchema
  ])
  export type response = typeof response.static
}
