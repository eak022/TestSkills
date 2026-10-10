import { t } from 'elysia'

export namespace RegisterModel {
  export const request = t.Object({
    userName: t.String({ example: 'dragonknight' }),
    email: t.String({ example: 'dragonKnight1140@gmail.com' }),
    password: t.String({ example: 'P@ssw0rd' }),
    confirmPassword: t.String({ example: 'P@ssw0rd' }),
    phoneNumber: t.Optional(t.String({ example: '0-2222-3333' }))
  })
  export type request = typeof request.static

  const UserSchema = t.Object({
    id: t.Number(),
    userName: t.String(),
    email: t.String(),
    balance: t.Number(),
    phoneNumber: t.String(),
    point: t.Number()
  })

  export const response = t.Composite([
    t.Object({
      accessToken: t.String(),
      refreshToken: t.String(),
      expireIn: t.Any(),
      user: UserSchema
    })
  ])
  export type response = typeof response.static
}
