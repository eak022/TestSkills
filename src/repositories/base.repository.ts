import { type PrismaTransactionalClient } from '@/libs/types/prisma-transaction-client.type'
import { type PaginatedResult, type PaginateOptions } from '@prisma/extensions'
import { type Prisma, type PrismaClient } from '@prisma/index'

export interface IBaseRepository<Model> {
  paginate<TArgs extends Prisma.Args<Model, 'findMany'>>(
    options: TArgs,
    pagination: PaginateOptions
  ): Promise<PaginatedResult<Prisma.Result<Model, TArgs, 'findMany'>>>
  create<TArgs extends Prisma.Args<Model, 'create'>>(
    payload: TArgs
  ): Promise<Prisma.Result<Model, TArgs, 'create'>>
  createMany<TArgs extends Prisma.Args<Model, 'createMany'>>(
    payload: TArgs
  ): Promise<Prisma.Result<Model, TArgs, 'createMany'>>
  findFirst<TArgs extends Prisma.Args<Model, 'findFirst'>>(
    payload: TArgs
  ): Promise<Prisma.Result<Model, TArgs, 'findFirst'>>
  findMany<TArgs extends Prisma.Args<Model, 'findMany'>>(
    payload: TArgs
  ): Promise<Prisma.Result<Model, TArgs, 'findMany'>>
  update<TArgs extends Prisma.Args<Model, 'update'>>(
    payload: TArgs
  ): Promise<Prisma.Result<Model, TArgs, 'update'>>
  updateMany<TArgs extends Prisma.Args<Model, 'updateMany'>>(
    payload: TArgs
  ): Promise<Prisma.Result<Model, TArgs, 'updateMany'>>
  softDelete<TArgs extends Prisma.Args<Model, 'findFirst'>>(
    payload: TArgs
  ): Promise<boolean>
  softDeleteMany<TArgs extends Prisma.Args<Model, 'findMany'>>(
    payload: TArgs
  ): Promise<boolean>
  findUnique<TArgs extends Prisma.Args<Model, 'findUnique'>>(
    payload: TArgs
  ): Promise<Prisma.Result<Model, TArgs, 'findUnique'>>
  upsert<TArgs extends Prisma.Args<Model, 'upsert'>>(
    payload: TArgs
  ): Promise<Prisma.Result<Model, TArgs, 'upsert'>>
  findById<TArgs extends Omit<Prisma.Args<Model, 'findUnique'>, 'where'>>(
    id: number,
    payload?: TArgs
  ): Promise<
    Prisma.Result<
      Model,
      Prisma.Args<Model, 'findUnique'> & { where: { id: number } },
      'findUnique'
    >
  >
}

type AnyPrismaClient
  = | Prisma.TransactionClient
    | PrismaClient
    | Record<string, any>

type Tx = PrismaClient | Prisma.TransactionClient | PrismaTransactionalClient

export class BaseRepository<
  ModelName extends keyof PrismaClient,
  Model
> implements IBaseRepository<Model> {
  constructor (
    readonly modelName: ModelName,
    readonly model: Model
  ) {}

  private getInstance (tx?: AnyPrismaClient): any {
    return ((tx ?? this.model) as any)[this.modelName] ?? (this.model as any)
  }

  paginate<TArgs extends Prisma.Args<Model, 'findMany'>>(
    options: TArgs,
    pagination: PaginateOptions,
    tx?: Tx
  ): Promise<PaginatedResult<Prisma.Result<Model, TArgs, 'findMany'>>> {
    return this.getInstance(tx).paginate({
      ...options,
      ...pagination
    })
  }

  create<TArgs extends Prisma.Args<Model, 'create'>>(
    payload: TArgs,
    tx?: Tx
  ): Promise<Prisma.Result<Model, TArgs, 'create'>> {
    return this.getInstance(tx).create(payload)
  }

  createMany<TArgs extends Prisma.Args<Model, 'createMany'>>(
    payload: TArgs,
    tx?: Tx
  ): Promise<Prisma.Result<Model, TArgs, 'createMany'>> {
    return this.getInstance(tx).createMany(payload)
  }

  findFirst<TArgs extends Prisma.Args<Model, 'findFirst'>>(
    payload: TArgs,
    tx?: Tx
  ): Promise<Prisma.Result<Model, TArgs, 'findFirst'>> {
    return this.getInstance(tx).findFirst(payload)
  }

  findMany<TArgs extends Prisma.Args<Model, 'findMany'>>(
    payload: TArgs,
    tx?: Tx
  ): Promise<Prisma.Result<Model, TArgs, 'findMany'>> {
    return this.getInstance(tx).findMany(payload)
  }

  update<TArgs extends Prisma.Args<Model, 'update'>>(
    payload: TArgs,
    tx?: Tx
  ): Promise<Prisma.Result<Model, TArgs, 'update'>> {
    return this.getInstance(tx).update(payload)
  }

  updateMany<TArgs extends Prisma.Args<Model, 'updateMany'>>(
    payload: TArgs,
    tx?: Tx
  ): Promise<Prisma.Result<Model, TArgs, 'updateMany'>> {
    return this.getInstance(tx).updateMany(payload)
  }

  softDelete<TArgs extends Prisma.Args<Model, 'findFirst'>>(
    payload: TArgs,
    tx?: Tx
  ): Promise<boolean> {
    return this.getInstance(tx).softDelete(payload)
  }

  softDeleteMany<TArgs extends Prisma.Args<Model, 'findMany'>>(
    payload: TArgs,
    tx?: Tx
  ): Promise<boolean> {
    return this.getInstance(tx).softDeleteMany(payload)
  }

  deleteMany<TArgs extends Prisma.Args<Model, 'findMany'>>(
    payload: TArgs,
    tx?: Tx
  ): Promise<boolean> {
    return this.getInstance(tx).deleteMany(payload)
  }

  findUnique<TArgs extends Prisma.Args<Model, 'findUnique'>>(
    payload: TArgs,
    tx?: Tx
  ): Promise<Prisma.Result<Model, TArgs, 'findUnique'>> {
    return this.getInstance(tx).findUnique(payload)
  }

  upsert<TArgs extends Prisma.Args<Model, 'upsert'>>(
    payload: TArgs,
    tx?: Tx
  ): Promise<Prisma.Result<Model, TArgs, 'upsert'>> {
    return this.getInstance(tx).upsert(payload)
  }

  findById<
    TArgs extends Omit<Prisma.Args<Model, 'findUnique'>, 'where'>
  >(
    id: number,
    payload?: TArgs,
    tx?: Tx
  ): Promise<
    Prisma.Result<
      Model,
      Prisma.Args<Model, 'findUnique'> & { where: { id: number } },
      'findUnique'
    >
  > {
    return this.getInstance(tx).findUnique({
      ...(payload ?? {}),
      where: { id }
    })
  }
}
