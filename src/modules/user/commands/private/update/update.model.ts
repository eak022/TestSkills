import { CommonResponseModel } from '@/libs/common/model.common'
import { t } from 'elysia'

export namespace UpdateUserModel {
  export const request = t.Object({
    userName: t.Optional(t.String({ example: 'dragonknight' })),
    password: t.Optional(t.String({ example: 'P@ssw0rd' })),
    email: t.Optional(t.String({ example: 'dragonKnight1140@gmail.com' })),
    phoneNumber: t.Optional(t.String({ example: '0-2222-3333' }))
  })
  export type request = typeof request.static

  export const params = t.Object({
    id: t.Number({ example: 1, description: 'The user ID — ได้จาก GET /user?page=1' })
  })
  export type params = typeof params.static

  export const successResponse = t.Composite([
    CommonResponseModel
  ])
  export type successResponse = typeof successResponse.static
}
