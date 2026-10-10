import { CommonResponseModel } from '@/libs/common/model.common'
import { Status } from '@prisma/index'
import { t } from 'elysia'

export namespace CreatePackageModel {
  export const request = t.Object({
    name: t.String({ example: '99+109 Coin' }),
    amount: t.Integer({ example: 208, minimum: 1, description: 'จำนวนเหรียญรวมที่ได้ (99+109)' }),
    price: t.Number({ example: 146, minimum: 0, description: 'ราคา (JPY)' }),
    status: t.Enum(Status, { example: 'ACTIVE', description: 'ACTIVE | InActive' }),
    gameId: t.Number({ example: 1, description: 'ได้จาก GET /game?page=1 (ต้องสร้างเกมก่อน)' })
  })
  export type request = typeof request.static

  export const successResponse = t.Composite([
    CommonResponseModel
  ])
  export type successResponse = typeof successResponse.static
}
