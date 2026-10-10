import { dayjs } from '@/libs/plugins/dayjs.plugin'
import { Prisma } from '@generated/client/client'

export async function softDeleteExtension<TModel, TArgs extends Prisma.Args<TModel, 'findFirst'>> (
  this: TModel,
  args?: Prisma.Exact<TArgs, Prisma.Args<TModel, 'findFirst'>>
): Promise<boolean> {
  const { where } = args as any
  const context = Prisma.getExtensionContext(this)

  try {
    await (context as any).update({
      where: {
        ...where,
        deletedAt: null
      },
      data: {
        deletedAt: dayjs().toDate()
      }
    })
    return true
  } catch {
    return false
  }
}

export async function softDeleteManyExtension<TModel, TArgs extends Prisma.Args<TModel, 'findMany'>> (
  this: TModel,
  args?: Prisma.Exact<TArgs, Prisma.Args<TModel, 'findMany'>>
): Promise<boolean> {
  const { where } = args as any
  const context = Prisma.getExtensionContext(this)

  try {
    await (context as any).updateMany({
      where: {
        ...where,
        deletedAt: null
      },
      data: {
        deletedAt: dayjs().toDate()
      }
    })
    return true
  } catch {
    return false
  }
}
