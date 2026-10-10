import { t } from 'elysia'
import { SortOrderEnum } from './enum.common'

export const CommonResponseModel = t.Object({
  message: t.Literal('success')
})
export type CommonResponseModel = typeof CommonResponseModel.static

export const CommonPaginationResponseModel = t.Object({
  message: t.Literal('success'),
  totalPage: t.Number(),
  page: t.Number(),
  limit: t.Number(),
  count: t.Number()
})
export type CommonPaginationResponseModel = typeof CommonPaginationResponseModel.static

export const CommonPaginationModel = t.Object({
  page: t.Integer({ default: 1, example: 1, description: 'หน้าที่ต้องการ เริ่มที่ 1' }),
  limit: t.Integer({ default: 10, example: 10, description: 'จำนวนต่อหน้า' }),
  sortBy: t.Optional(t.String({ default: 'createdAt', example: 'createdAt' })),
  sortOrder: t.Optional(t.Enum(SortOrderEnum, { default: SortOrderEnum.DESC, example: SortOrderEnum.DESC })),
  search: t.Optional(t.String({ default: '', example: '', description: 'ค้นหาจากชื่อ (เว้นว่าง = ทั้งหมด)' }))
})
export type CommonPaginationModel = typeof CommonPaginationModel.static

export const CommonPaginationSettingModel = t.Omit(CommonPaginationModel, ['sortBy', 'sortOrder', 'search'])
export type CommonPaginationSettingModel = typeof CommonPaginationSettingModel.static
