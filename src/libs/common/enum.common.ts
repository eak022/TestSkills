export type EnumValues<T extends Record<string, string | number>> = T[keyof T]

export enum SortOrderEnum {
  ASC = 'asc',
  DESC = 'desc'
}
