import { Prisma } from '@generated/client/client'

export async function findOrCreateExtension<TModel, TArgs extends Prisma.Args<TModel, 'update'>> (
  this: TModel,
  args?: Prisma.Exact<TArgs, Prisma.Args<TModel, 'update'>>
): Promise<Prisma.Result<TModel, TArgs, 'update'>> {
  const { where, data } = args as any
  const context = Prisma.getExtensionContext(this)

  try {
    const find = await (context as any).findUniqueOrThrow({
      where: {
        ...where
      }
    })
    return await (context as any).update({
      where: {
        id: find?.id
      },
      data: {
        ...data
      }
    })
  } catch (error) {
    console.log(error)
    if (data?.count?.increment) {
      return await (context as any).create({
        data: {
          name: data?.name,
          count: 1
        }
      })
    } else {
      return await (context as any).create({
        data: {
          ...data
        }
      })
    }
  }
}
