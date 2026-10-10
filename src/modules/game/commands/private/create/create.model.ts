import { CommonResponseModel } from '@/libs/common/model.common'
import { Status } from '@prisma/index'
import { t } from 'elysia'

export namespace CreateGameModel {
  export const request = t.Object({
    name: t.String({ example: 'Age of Empires Mobile' }),
    status: t.Enum(Status, { example: 'ACTIVE', description: 'ACTIVE | InActive' }),
    servers: t.Optional(t.Array(t.Object({
      serverName: t.String({ example: 'Empire#239' })
    }), { example: [{ serverName: 'Empire#239' }], description: 'เซิร์ฟเวอร์ของเกม — ต้องมีอย่างน้อย 1 ตัวถึงสร้างออเดอร์ได้ (serverId ดูจาก GET /game/{id})' }))
  })
  export type request = typeof request.static

  export const successResponse = t.Composite([
    CommonResponseModel
  ])
  export type successResponse = typeof successResponse.static
}
