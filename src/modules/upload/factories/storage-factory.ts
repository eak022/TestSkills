import { MinioStorage } from '@/modules/upload/adapters/storage/minio-storage'
import type { FileStorage } from '@/modules/upload/core/ports/file-storage'

export function createStorageFromEnv (): FileStorage {
  const result = new MinioStorage({
    endpoint: Bun.env.MINIO_ENDPOINT!,
    port: parseInt(Bun.env.MINIO_PORT!),
    useSSL: Bun.env.MINIO_USE_SSL === 'true',
    accessKey: Bun.env.MINIO_ACCESS_KEY_ID!,
    secretKey: Bun.env.MINIO_SECRET_KEY!,
    bucket: Bun.env.MINIO_BUCKET!
  })

  return result
}

// export function createStorageFromEnv (): FileStorage {
//   const provider = Bun.env.STORAGE_DRIVER || 'minio'

//   switch (provider) {
//     case 'minio':
//       return new MinioStorage({
//         endpoint: Bun.env.MINIO_ENDPOINT!,
//         port: parseInt(Bun.env.MINIO_PORT!),
//         useSSL: Bun.env.MINIO_USE_SSL === 'true',
//         accessKey: Bun.env.MINIO_ACCESS_KEY_ID!,
//         secretKey: Bun.env.MINIO_SECRET_KEY!,
//         bucket: Bun.env.MINIO_BUCKET!
//       })

//     case 's3':
//       return new S3Storage({
//         region: Bun.env.S3_REGION!,
//         accessKeyId: Bun.env.S3_ACCESS_KEY_ID!,
//         secretAccessKey: Bun.env.S3_SECRET_KEY!,
//         bucket: Bun.env.S3_BUCKET!
//       })

//     case 'gcs':
//       return new GCSStorage({
//         bucket: Bun.env.GCS_BUCKET!,
//         projectId: Bun.env.GCS_PROJECT_ID!,
//         keyFilename: Bun.env.GCS_KEY_FILENAME!
//       })

//     default:
//       throw new Error(`Unsupported storage provider: ${provider}`)
//   }
// }
