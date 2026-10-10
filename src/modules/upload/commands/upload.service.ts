import { toUploadUtilFile } from '../adapters/storage/gcs-storage'
import type { UploadModel } from './upload.model'
import { uploadLogic } from 'src/libs/utils/upload.util'

export class UploadService {
  constructor (
  ) {}

  async execute (body: UploadModel.body) {
    const { file } = body

    const adaptedFile = await toUploadUtilFile(file)

    const result = await uploadLogic(adaptedFile)
    return result
  }
}
