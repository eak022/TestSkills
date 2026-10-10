import { PrismaPg } from '@prisma/adapter-pg'
import { type Prisma, PrismaClient } from '../generated/client/client'
import { existsExtension, findOrCreateExtension, paginateExtension, softDeleteExtension, softDeleteManyExtension } from './extensions'

const NODE_ENV = process.env.NODE_ENV || Bun.env.NODE_ENV || 'development'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
})

export const prisma = new PrismaClient({ adapter }).$extends({
  model: {
    $allModels: {
      paginate: paginateExtension,
      exists: existsExtension,
      softDelete: softDeleteExtension,
      softDeleteMany: softDeleteManyExtension,
      findOrCreate: findOrCreateExtension
    }
  }
})

const globalForPrisma = global as any as { prisma: typeof prisma }

if (NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export * from '../generated/client/client'

export type PrismaCoreDatabase = typeof prisma

export type { Prisma }
