import { t } from 'elysia'

export namespace FirstLoginModel {
  export const request = t.Object({
    email: t.String({ example: 'dragonKnight1140@gmail.com', description: 'อีเมลของบัญชีที่ยังไม่เคยตั้งรหัสผ่าน' }),
    password: t.String({ example: 'P@ssw0rd' }),
    confirmPassword: t.String({ example: 'P@ssw0rd', description: 'ต้องตรงกับ password' })
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
