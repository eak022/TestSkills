import { NotFoundError } from 'elysia'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import type { FileStorage, UploadedFile } from '../../core/ports/file-storage'
import { generateRandomFromDateTime } from '../../libs/utils/generate-random-from-date-time.util'
import { Client } from 'minio'

interface MinioError extends Error {
  code?: string
  statusCode?: number
}

function isMinioError (error: unknown): error is MinioError {
  return error instanceof Error && 'code' in error
}

function getErrorMessage (error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export class MinioStorage implements FileStorage {
  private client: Client

  private bucket: string

  constructor (config: {
    endpoint: string
    port: number
    useSSL: boolean
    accessKey: string
    secretKey: string
    bucket: string
  }) {
    this.client = new Client({
      endPoint: config.endpoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey
    })

    this.bucket = config.bucket
  }

  async uploadOne (file: File, subFolder?: string): Promise<UploadedFile> {
    try {
      const bucketExists = await this.client.bucketExists(this.bucket)
      if (!bucketExists) {
        throw new NotFoundError('ไม่พบ bucket ที่ระบุ')
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const fileName = file.name.split('.')
      const extension = fileName[fileName.length - 1]
      const newFileName = `${generateRandomFromDateTime()}.${extension}`
      const subFolderName = subFolder ? `${subFolder}/${newFileName}` : newFileName

      const filePath = `${subFolderName}`.replace(/\/\//g, '/').replace(/\/$/, '')

      await this.client.putObject(this.bucket, filePath, buffer, buffer.length, {
        'Content-Type': file.type
      })
      await this.client.statObject(this.bucket, filePath)
      const url = await this.client.presignedGetObject(this.bucket, filePath, 60) // 1 min expiration

      return {
        originalName: file.name,
        fileUrl: url,
        fileType: file.type,
        filePath: filePath
      }
    } catch (error: unknown) {
      if (isMinioError(error)) {
        if (error.code === 'BucketNotFound') {
          throw new NotFoundError('ไม่พบ bucket ที่ระบุ')
        }
        if (error.code === 'AccessDenied') {
          throw new BadRequestError('ไม่มีสิทธิ์ในการอัปโหลดไฟล์')
        }
        if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
          throw new BadRequestError('การอัปโหลดไฟล์ไม่สำเร็จ')
        }
      }
      throw new BadRequestError(`ไม่สามารถอัปโหลดไฟล์ได้: ${getErrorMessage(error)}`)
    }
  }

  async uploadMany (files: File[], subFolder?: string): Promise<UploadedFile[]> {
    return Promise.all(files.map((file) => this.uploadOne(file, subFolder)))
  }

  async getPresignedUrl (filePath: string, expiration: number): Promise<string> {
    try {
      await this.client.statObject(this.bucket, filePath)
      const url = await this.client.presignedGetObject(this.bucket, filePath, expiration)
      return url
    } catch (error: unknown) {
      if (isMinioError(error)) {
        if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
          throw new NotFoundError(`ไม่พบไฟล์ที่ระบุ: ${filePath}`)
        }
        if (error.code === 'BucketNotFound') {
          throw new NotFoundError('ไม่พบ bucket ที่ระบุ')
        }
        if (error.code === 'AccessDenied') {
          throw new BadRequestError('ไม่มีสิทธิ์ในการเข้าถึงไฟล์')
        }
      }
      throw new BadRequestError(`ไม่สามารถสร้าง URL สำหรับไฟล์ได้: ${getErrorMessage(error)}`)
    }
  }

  async deleteFile (filePath: string): Promise<void> {
    try {
      await this.client.statObject(this.bucket, filePath)
      await this.client.removeObject(this.bucket, filePath)
    } catch (error: unknown) {
      if (isMinioError(error) && (error.code === 'NoSuchKey' || error.code === 'NotFound')) {
        throw new NotFoundError(`ไม่พบไฟล์ที่ระบุ: ${filePath}`)
      }
      throw new BadRequestError(`ไม่สามารถลบไฟล์ได้: ${getErrorMessage(error)}`)
    }
  }
}
