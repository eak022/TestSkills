import { type SortOrderEnum } from '@/libs/common/enum.common'
import { type Prisma } from '@prisma/index'

export const buildOrderBy = (sortBy: string | undefined, sortOrder: SortOrderEnum | undefined, defaultSortBy: string = 'createdAt') => {
  return { [sortBy || defaultSortBy]: sortOrder }
}

export const buildSearch = (search: string | undefined): Prisma.StringFilter => {
  return {
    contains: search,
    mode: 'insensitive'
  }
}

export const buildSearchJson = (search: string | undefined, path: string): Prisma.JsonNullableFilter => {
  return {
    path: [path],
    string_contains: search,
    mode: 'insensitive'
  }
}
