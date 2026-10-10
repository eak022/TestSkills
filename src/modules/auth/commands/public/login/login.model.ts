import { t } from 'elysia'

export namespace LoginModel {
  export const request = t.Object({
    email: t.String({ example: 'dragonKnight1140@gmail.com', description: 'อีเมลที่ใช้สมัคร (ใช้ email ไม่ใช่ userName) — แอดมินคืออีเมลใน SYSTEM_USER_EMAIL' }),
    password: t.String({ example: 'P@ssw0rd' })
  })
  const UserSchema = t.Object({
    id: t.Number(),
    userName: t.String(),
    email: t.String(),
    balance: t.Number(),
    phoneNumber: t.String(),
    point: t.Number()
  })

  export type request = typeof request.static

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
