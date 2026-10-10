import { BEARER_SECURITY } from '@/libs/docs/security'
import Elysia from 'elysia'
import { UploadModel } from './upload.model'
import { UploadService } from './upload.service'
import { UserAuthGuard } from '@/libs/guards/user.guard'

export const UploadHttpController = new Elysia({ name: 'UploadHttpController' })
  .use(UserAuthGuard)
  .post(
    '/', async ({ body }) => {
      const service = new UploadService()
      const result = await service.execute(body as UploadModel.body)
      return { message: 'success', data: result }
    }, {
      detail: {
        security: BEARER_SECURITY,
        summary: 'Upload',
        description: 'Upload',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: UploadModel.body
            }
          }
        }
      },
      auth: true,
      response: {
        201: UploadModel.response
      }
    }
  )
