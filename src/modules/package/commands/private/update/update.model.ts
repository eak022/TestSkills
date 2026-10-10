import { CommonResponseModel } from '@/libs/common/model.common'
import { Status } from '@prisma/index'
import { t } from 'elysia'

export namespace UpdatePackageModel {
  export const request = t.Object({
    name: t.Optional(t.String({ example: '99+109 Coin' })),
    amount: t.Optional(t.Integer({ example: 208, minimum: 1 })),
    price: t.Optional(t.Number({ example: 146, minimum: 0, description: 'ราคา (JPY)' })),
    status: t.Optional(t.Enum(Status, { example: 'ACTIVE', description: 'ACTIVE | InActive' })),
    gameId: t.Optional(t.Number({ example: 1 }))
  })
  export type request = typeof request.static

  export const params = t.Object({
    id: t.Number({ example: 1, description: 'The package ID — ได้จาก GET /package?page=1' })
  })
  export type params = typeof params.static

  export const successResponse = t.Composite([
    CommonResponseModel
  ])
  export type successResponse = typeof successResponse.static
}
