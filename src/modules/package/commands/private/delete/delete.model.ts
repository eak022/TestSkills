import { CommonResponseModel } from '@/libs/common/model.common'
import { t } from 'elysia'

export namespace DeletePackageModel {
  export const params = t.Object({
    id: t.Number({ example: 1, description: 'The package ID — ได้จาก GET /package?page=1' })
  })
  export type params = typeof params.static

  export const successResponse = t.Composite([
    CommonResponseModel
  ])
  export type successResponse = typeof successResponse.static
}
