import { UserRole } from '@prisma/index'
import { t } from 'elysia'
import { CommonPaginationModel, CommonPaginationResponseModel } from '@/libs/common/model.common'

const UserSchema = t.Object({
  id: t.Number(),
  userNo: t.Nullable(t.String()),
  userName: t.String(),
  email: t.String(),
  phoneNumber: t.Nullable(t.String()),
  balance: t.Number(),
  point: t.Number(),
  role: t.Enum(UserRole, { example: 'CUSTOMER', description: 'CUSTOMER | ADMIN' })
})

export type UserSchema = typeof UserSchema.static

export namespace FindUserPaginationModel {
  export const query = t.Composite([
    CommonPaginationModel
  ])
  export type query = typeof query.static

  export const successResponse = t.Composite([
    CommonPaginationResponseModel,
    t.Object({
      data: t.Array(UserSchema)
    })
  ])
  export type successResponse = typeof successResponse.static
}
