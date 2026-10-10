import { CommonResponseModel } from '@/libs/common/model.common'
import { t } from 'elysia'

export namespace UploadModel {
  export const body = t.Object({
    file: t.File({ description: 'ไฟล์ที่ต้องการอัปโหลด (multipart/form-data, field ชื่อ file)' })
  }, {
    multiFile: false,
    contentType: 'multipart/form-data'
  })
  export type body = typeof body.static

  export const response = t.Composite([
    CommonResponseModel,
    t.Object({
      data: t.Object({
        publicUrl: t.String(),
        name: t.String()
      })
    })
  ])
  export type response = typeof response.static
}
