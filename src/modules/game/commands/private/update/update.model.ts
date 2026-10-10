import { CommonResponseModel } from '@/libs/common/model.common'
import { Status } from '@prisma/index'
import { t } from 'elysia'

export namespace UpdateGameModel {
  export const request = t.Object({
    name: t.Optional(t.String({ example: 'Age of Empires Mobile' })),
    status: t.Optional(t.Enum(Status, { example: 'ACTIVE', description: 'ACTIVE | InActive' })),
    servers: t.Optional(t.Array(t.Object({
      id: t.Optional(t.Number({ example: 1, description: 'ใส่ id ของเซิร์ฟเวอร์เดิมเพื่อแก้ไข ไม่ใส่ = เพิ่มใหม่' })),
      serverName: t.String({ example: 'Empire#239' })
    }), { example: [{ id: 1, serverName: 'Empire#239' }, { serverName: 'Empire#240' }], description: 'มี id = แก้เซิร์ฟเวอร์เดิม, ไม่มี id = เพิ่มใหม่' }))
  })
  export type request = typeof request.static

  export const params = t.Object({
    id: t.Number({ example: 1, description: 'The game ID — ได้จาก GET /game?page=1' })
  })
  export type params = typeof params.static

  export const successResponse = t.Composite([
    CommonResponseModel
  ])
  export type successResponse = typeof successResponse.static
}
