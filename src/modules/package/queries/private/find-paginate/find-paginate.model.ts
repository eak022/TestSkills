import { t } from 'elysia'
import { CommonPaginationModel, CommonPaginationResponseModel } from '@/libs/common/model.common'
import { Status } from '@prisma/index'

const PackageSchema = t.Object({
  id: t.Number(),
  name: t.String(),
  amount: t.Number(),
  price: t.Number(),
  status: t.Enum(Status),
  gameId: t.Number(),
  gameName: t.String()
})

export type PackageSchema = typeof PackageSchema.static

export namespace FindPackagePaginationModel {
  export const query = t.Composite([
    CommonPaginationModel,
    t.Object({
      status: t.Optional(t.Enum(Status, { example: 'ACTIVE', description: 'กรองตามสถานะ (ไม่ใส่ = ทั้งหมด)' })),
      gameId: t.Optional(t.Number({ example: 1, description: 'กรองเฉพาะเกมนี้ (id จาก GET /game)' }))
    })
  ])
  export type query = typeof query.static

  export const successResponse = t.Composite([
    CommonPaginationResponseModel,
    t.Object({
      data: t.Array(PackageSchema)
    })
  ])
  export type successResponse = typeof successResponse.static
}
