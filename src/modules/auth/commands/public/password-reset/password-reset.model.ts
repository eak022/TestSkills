import { t } from 'elysia'
import { CommonResponseModel } from '@/libs/common/model.common'

export namespace PasswordResetModel {
  export const request = t.Object({
    phoneNumber: t.String({ example: '0-2222-3333', description: 'เบอร์โทรที่ลงทะเบียนไว้ตอนสมัคร' }),
    newPassword: t.String({ example: 'N3wP@ssw0rd' }),
    confirmPassword: t.String({ example: 'N3wP@ssw0rd', description: 'ต้องตรงกับ newPassword' })
  })
  export type request = typeof request.static

  export const response = t.Composite([
    CommonResponseModel
  ])
  export type response = typeof response.static
}
