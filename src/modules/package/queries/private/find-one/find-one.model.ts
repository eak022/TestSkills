import { Status } from '@prisma/index'
import { t } from 'elysia'

export namespace FindOnePackageModel {
  export const params = t.Object({
    id: t.Number({ example: 1, description: 'The package ID — ได้จาก GET /package?page=1' })
  })
  export type params = typeof params.static

  export const PackageSchema = t.Object({
    id: t.Number(),
    name: t.String(),
    amount: t.Number(),
    price: t.Number(),
    status: t.Enum(Status),
    gameId: t.Number(),
    gameName: t.String()
  })

  export const response = t.Composite([
    PackageSchema
  ])
  export type response = typeof response.static
}
