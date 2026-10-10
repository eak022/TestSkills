import { t } from 'elysia'

export namespace CheckLoginModel {
  export const request = t.Object({
    email: t.String({ example: 'dragonKnight1140@gmail.com' })
  })
  export type request = typeof request.static

  export const successResponse = t.Composite([
    t.Object({
      isConfirm: t.Boolean()
    })
  ])
  export type successResponse = typeof successResponse.static
}
