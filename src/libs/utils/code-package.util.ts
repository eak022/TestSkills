import { BadRequestError } from '@/libs/middlewares/error-handler/domain'

export const CODE_PACKAGE_MAX_BYTES = 20 * 1024 * 1024

export function safeZipFileName (name: string) {
  const base = name.split(/[/\\]/).pop() || 'package.zip'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleaned.toLowerCase().endsWith('.zip') ? cleaned : `${cleaned}.zip`
}

export function assertZipPackage (name: string, bytes: Uint8Array) {
  if (!name.toLowerCase().endsWith('.zip')) {
    throw new BadRequestError('รับเฉพาะไฟล์ .zip')
  }
  if (bytes.length === 0) {
    throw new BadRequestError('ไฟล์ zip ว่าง')
  }
  if (bytes.length > CODE_PACKAGE_MAX_BYTES) {
    throw new BadRequestError('ไฟล์ zip ใหญ่เกิน 20MB')
  }
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04
  if (!isZip) {
    throw new BadRequestError('ไฟล์ไม่ใช่ zip')
  }
}
