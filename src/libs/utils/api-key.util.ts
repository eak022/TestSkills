import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export const BOT_API_KEY_PREFIX = 'bot_'

// คีย์สุ่ม 256 บิต — เก็บใน DB เป็น sha256 เท่านั้น แสดงให้เห็นครั้งเดียวตอนออกคีย์
export function generateBotApiKey (): string {
  return `${BOT_API_KEY_PREFIX}${randomBytes(32).toString('hex')}`
}

export function hashApiKey (key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function safeEqual (a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
