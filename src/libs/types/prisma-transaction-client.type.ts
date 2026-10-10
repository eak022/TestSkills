import { type prisma } from '@prisma/index'

export type PrismaTransactionalClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
