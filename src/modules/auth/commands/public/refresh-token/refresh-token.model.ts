import { t } from 'elysia'

export namespace RefreshModel {
  export const request = t.Object({
    refreshToken: t.String({ example: '9f2c...(ค่า refreshToken จาก login / register)', description: 'ได้จาก response ของ login หรือ register' })
  })
  export type request = typeof request.static

  export const response = t.Composite([
    t.Object({
      accessToken: t.String()
    })
  ])
  export type response = typeof response.static
}
