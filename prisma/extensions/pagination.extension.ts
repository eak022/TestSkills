import { type Prisma } from '@generated/client/client'

export type PaginateOptions = {
  page?: number
  limit?: number
  where?: object
}

export type PaginatedResult<T> = {
  message: 'success'
  data: T
  totalPage: number
  page: number
  limit: number
  count: number
}

export async function paginateExtension<TModel, TArgs extends Prisma.Args<TModel, 'findMany'>> (
  this: TModel,
  args: Prisma.Exact<TArgs, Prisma.Args<TModel, 'findMany'>> & PaginateOptions
): Promise<PaginatedResult<Prisma.Result<TModel, TArgs, 'findMany'>>> {
  const { page = 1, limit = 10, where = {} } = args as PaginateOptions
  const skip = (Number(page) - 1) * Number(limit)

  const argsWithoutPaginateOptions = Object.keys(args).reduce((acc, key) => {
    if (key !== 'page' && key !== 'limit' && key !== 'where') {
      (acc as any)[key] = (args as any)[key]
    }
    return acc
  }, {} as any)

  const [total, rawData] = await Promise.all([
    (this as any).count({ where }),
    (this as any).findMany({
      skip,
      take: Number(limit),
      where,
      ...argsWithoutPaginateOptions
    })
  ])

  return {
    message: 'success',
    data: rawData,
    count: Number(total),
    page: Number(page),
    limit: Number(limit),
    totalPage: Math.ceil(Number(total) / Number(limit))
  }
}
