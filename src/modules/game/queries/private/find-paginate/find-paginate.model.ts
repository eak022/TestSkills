import { t } from 'elysia'
import { CommonPaginationModel, CommonPaginationResponseModel } from '@/libs/common/model.common'
import { Status } from '@prisma/index'

const GameSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  status: t.Enum(Status)
})

export type GameSchema = typeof GameSchema.static

export namespace FindGamePaginationModel {
  export const query = t.Composite([
    CommonPaginationModel,
    t.Object({
      status: t.Optional(t.Enum(Status, { example: 'ACTIVE', description: 'กรองตามสถานะ (ไม่ใส่ = ทั้งหมด)' }))
    })
  ])
  export type query = typeof query.static

  export const successResponse = t.Composite([
    CommonPaginationResponseModel,
    t.Object({
      data: t.Array(GameSchema)
    })
  ])
  export type successResponse = typeof successResponse.static
}
