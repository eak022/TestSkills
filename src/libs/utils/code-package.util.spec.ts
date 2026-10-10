import { describe, expect, it } from 'bun:test'
import { BadRequestError } from '@/libs/middlewares/error-handler/domain'
import { assertZipPackage, safeZipFileName } from './code-package.util'

const zipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0])

describe('code package zip', () => {
  it('keeps a safe zip file name', () => {
    expect(safeZipFileName('../pack zip.zip')).toBe('pack_zip.zip')
    expect(safeZipFileName('folder\\bot-pack.zip')).toBe('bot-pack.zip')
  })

  it('accepts a small zip header', () => {
    expect(() => assertZipPackage('bot-pack.zip', zipHeader)).not.toThrow()
  })

  it('rejects a file that is not a zip', () => {
    expect(() => assertZipPackage('notes.txt', zipHeader)).toThrow(BadRequestError)
    expect(() => assertZipPackage('fake.zip', new Uint8Array([1, 2, 3, 4]))).toThrow(BadRequestError)
  })
})
