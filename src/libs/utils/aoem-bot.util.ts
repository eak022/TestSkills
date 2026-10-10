/** หน้าแรกของร้านญี่ปุ่น ลิงก์แพ็กตรง ๆ เปิดแล้วได้หน้าว่าง */
export const AOEM_ENTRY_URL = 'https://www.midasbuy.com/midasbuy/jp/shop'
/** ได้หลังกดการ์ด Age of Empires Mobile จากหน้าร้าน จุดคือ # ไม่ใช่ #! และ from ใช้จุด */
export const AOEM_SHOP_URL = 'https://www.midasbuy.com/midasbuy/jp/shop/aoem?from=self.midasbuy_saas#/pages/shop/items'
export const AOEM_PRICE_JPY = 146
export const AOEM_PACK_LABEL = '99+109 Coin'
export const AOEM_PACK_SHOP_NAME = '99至高コイン'
export const AOEM_SERVER = 'Empire#239'
export const AOEM_PLAYER_UID = '5250140737488366145'

export const AOEM_STEPS = [
  'เปิดร้าน Region Japan',
  'login Midasbuy จาก env ก่อนทุกออเดอร์',
  'กรอก Player ID แล้วตรวจเซิร์ฟเวอร์ Empire#239',
  'เลือกแพ็ก 99+109 Coin / 146 JPY เท่านั้น',
  'เลือกแถว BitCash',
  'กด Pay แล้วเลือก Pay with MyBitCash',
  'login Bitcash แล้วอ่านยอดก่อนจ่าย',
  'รอ OTP ที่คนวางให้ในช่วง 12:00–17:00 ไม่ดึงเมลเองและไม่ผ่าน CAPTCHA',
  'กดจ่ายครั้งเดียว',
  'เทียบประวัติ Midasbuy กับส่วนต่าง Bitcash แล้วค่อยผูก orderNo'
] as const

export type AoemFailCode = 'PACK_NOT_FOUND' | 'REGION_MISMATCH' | 'SELECTOR_CHANGED' | 'CAPTCHA' | 'UID_INVALID'

export type AoemWaitReason
  = | 'OUTSIDE_OTP_WINDOW'
    | 'OTP_TIMEOUT'
    | 'CHECK_INCOMPLETE'
    | 'PAID_NOT_CREDITED'
    | 'AMOUNT_MISMATCH'
    | 'MISSING_SECRET'
    | 'BROWSER_MISSING'
    | 'UI_UNSEEN'

export type AoemRunResult
  = | { action: 'complete', orderNo: string }
    | { action: 'fail', errorCode: AoemFailCode }
    | { action: 'wait', reason: AoemWaitReason }

export type AoemReceipt = {
  orderNo: string
  payClicked: boolean
  bitcashBefore: number | null
  bitcashAfter: number | null
  invoiceAmount: number | null
  invoiceNo: string | null
  midasbuyPriceJpy: number | null
}

export const AOEM_OTP_FILE = 'data/aoem-otp.txt'

/** รับเฉพาะรหัสตัวเลข 4–8 หลักที่คนวางให้ รหัสว่างหรือข้อความอื่นใช้ไม่ได้ */
export function parseBitcashOtp (raw: string | null | undefined): string | null {
  const text = raw?.trim() ?? ''
  if (!/^\d{4,8}$/.test(text)) return null
  return text
}

export function isHrOtpWindow (now: Date, timeZone = 'Asia/Bangkok'): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value)
  const mins = hour * 60 + minute
  return mins >= 12 * 60 && mins < 17 * 60
}

export function isAllowedAoemPack (packageName: string, amount: number): boolean {
  const name = packageName.trim()
  const named = name === AOEM_PACK_LABEL || name.includes(AOEM_PACK_SHOP_NAME)
  return named && amount === AOEM_PRICE_JPY
}

/** การ์ดบนแท็บショップ จาก docs/โจทย์ที่-4/ui-observed.md ป้าย -2.66% ไม่พอ เพราะ Empire Coins 400 ก็ราคา 146円 */
export function isObservedSupremeCoinCard (text: string): boolean {
  const flat = text.replace(/\s+/g, ' ').trim()
  const pair = /(?:^|[^\d])99\s*\+\s*109(?:[^\d]|$)/.test(flat)
  const price = /(?:^|[^\d])146\s*円/.test(flat)
  return pair && price
}

export function reconcileAoemPayment (input: {
  orderNo: string
  bitcashBefore: number | null
  bitcashAfter: number | null
  invoiceAmount: number | null
  midasbuyPriceJpy: number | null
}): AoemRunResult {
  if (
    input.bitcashBefore == null
    || input.bitcashAfter == null
    || input.invoiceAmount == null
    || input.midasbuyPriceJpy == null
  ) {
    return { action: 'wait', reason: 'CHECK_INCOMPLETE' }
  }

  const delta = input.bitcashBefore - input.bitcashAfter
  if (delta === 0) {
    return { action: 'wait', reason: 'CHECK_INCOMPLETE' }
  }
  if (delta !== AOEM_PRICE_JPY || input.invoiceAmount !== AOEM_PRICE_JPY) {
    return { action: 'wait', reason: 'AMOUNT_MISMATCH' }
  }
  if (input.midasbuyPriceJpy !== AOEM_PRICE_JPY) {
    return { action: 'wait', reason: 'PAID_NOT_CREDITED' }
  }
  return { action: 'complete', orderNo: input.orderNo }
}
