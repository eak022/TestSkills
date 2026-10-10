import { Prisma } from '@generated/client/client'

export async function existsExtension<TModel, TArgs extends Prisma.Args<TModel, 'findFirstOrThrow'>> (
  this: TModel,
  args?: Prisma.Exact<TArgs, Prisma.Args<TModel, 'findFirstOrThrow'>>
): Promise<boolean> {
  const context = Prisma.getExtensionContext(this)

  try {
    await (context as any).findFirstOrThrow(args)
    return true
  } catch {
    return false
  }
}
