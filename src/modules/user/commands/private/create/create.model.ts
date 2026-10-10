import { CommonResponseModel } from '@/libs/common/model.common'
import { t } from 'elysia'

export namespace CreateUserModel {
  export const request = t.Object({
    userName: t.String({ example: 'dragonknight' }),
    password: t.String({ example: 'P@ssw0rd' }),
    email: t.String({ example: 'dragonKnight1140@gmail.com' }),
    phoneNumber: t.Optional(t.String({ example: '0-2222-3333' }))
  })
  export type request = typeof request.static

  export const successResponse = t.Composite([
    CommonResponseModel
  ])
  export type successResponse = typeof successResponse.static
}
