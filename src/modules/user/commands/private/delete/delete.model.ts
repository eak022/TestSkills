import { CommonResponseModel } from '@/libs/common/model.common'
import { t } from 'elysia'

export namespace DeleteUserModel {

  export const params = t.Object({
    id: t.Number({ example: 1, description: 'The user ID — ได้จาก GET /user?page=1' })
  })
  export type params = typeof params.static

  export const successResponse = t.Composite([
    CommonResponseModel
  ])
  export type successResponse = typeof successResponse.static
}
