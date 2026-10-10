import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { type SystemSettingRepository } from '@/repositories/system-setting.repository'
import { assertZipPackage, safeZipFileName } from '@/libs/utils/code-package.util'
import { type Prisma } from '@prisma/index'

export const CODE_PACKAGE_KEY = 'codePackage'

export type CodePackageMeta = {
  fileName: string
  sizeBytes: number
  uploadedAt: string
  version: string
}

const PACKAGE_DIR = join(process.cwd(), 'data', 'bot-packages')

export class CodePackageService {
  constructor (private readonly settings: SystemSettingRepository) {}

  async latest (): Promise<CodePackageMeta | null> {
    const row = await this.settings.findUnique({ where: { key: CODE_PACKAGE_KEY } })
    const value = row?.value as CodePackageMeta | null
    if (!value?.fileName || !value.uploadedAt) return null
    return {
      fileName: value.fileName,
      sizeBytes: Number(value.sizeBytes) || 0,
      uploadedAt: value.uploadedAt,
      version: value.version
    }
  }

  // เก็บไฟล์ไว้เท่านั้น ไม่ unzip และไม่สั่งรันบนเซิร์ฟเวอร์กลาง
  async store (file: File, version: string, actor: string): Promise<CodePackageMeta> {
    const bytes = new Uint8Array(await file.arrayBuffer())
    assertZipPackage(file.name || 'package.zip', bytes)
    const fileName = safeZipFileName(file.name || 'package.zip')
    await mkdir(PACKAGE_DIR, { recursive: true })
    const storedName = `${Date.now()}-${fileName}`
    await Bun.write(join(PACKAGE_DIR, storedName), bytes)

    const meta: CodePackageMeta = {
      fileName,
      sizeBytes: bytes.length,
      uploadedAt: new Date().toISOString(),
      version: version.trim()
    }
    await this.settings.upsert({
      where: { key: CODE_PACKAGE_KEY },
      create: {
        key: CODE_PACKAGE_KEY,
        value: { ...meta, storedName, uploadedBy: actor } as Prisma.InputJsonValue
      },
      update: {
        value: { ...meta, storedName, uploadedBy: actor } as Prisma.InputJsonValue
      }
    })
    return meta
  }
}
