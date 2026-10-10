import { Status } from '@prisma/index'
import { t } from 'elysia'

export namespace FindOneGameModel {
  export const params = t.Object({
    id: t.Number({ example: 1, description: 'The game ID — ได้จาก GET /game?page=1' })
  })
  export type params = typeof params.static

  const ServerSchema = t.Object({
    id: t.Number(),
    serverName: t.String()
  })

  export const GameSchema = t.Object({
    id: t.Number(),
    name: t.String(),
    status: t.Enum(Status),
    servers: t.Array(ServerSchema)
  })

  export const response = t.Composite([
    GameSchema
  ])
  export type response = typeof response.static
}
