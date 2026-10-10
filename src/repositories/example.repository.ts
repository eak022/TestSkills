import { prisma } from '@prisma/index'
import { BaseRepository } from './base.repository'

export interface IExampleRepository extends BaseRepository<'example', typeof prisma.example> {}

export class ExampleRepository
  extends BaseRepository<'example', typeof prisma.example>
  implements IExampleRepository {
  constructor () {
    super('example', prisma.example)
  }
}
