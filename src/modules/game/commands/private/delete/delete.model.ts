import { CommonResponseModel } from '@/libs/common/model.common'
import { t } from 'elysia'

export namespace DeleteGameModel {
  export const params = t.Object({
    id: t.Number({ example: 1, description: 'The game ID — ได้จาก GET /game?page=1' })
  })
  export type params = typeof params.static

  export const successResponse = t.Composite([
    CommonResponseModel
  ])
  export type successResponse = typeof successResponse.static
}
