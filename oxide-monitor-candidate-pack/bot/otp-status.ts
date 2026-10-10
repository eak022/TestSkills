import { readFile } from 'node:fs/promises'
import { AOEM_OTP_FILE, isHrOtpWindow, parseBitcashOtp } from '@/libs/utils/aoem-bot.util'

const now = new Date()
const open = isHrOtpWindow(now)
let otpReady = false
try {
  otpReady = parseBitcashOtp(await readFile(AOEM_OTP_FILE, 'utf8')) !== null
} catch {
  otpReady = false
}

console.log(JSON.stringify({
  now: now.toISOString(),
  timeZone: 'Asia/Bangkok',
  otpWindowOpen: open,
  otpFile: AOEM_OTP_FILE,
  otpReady,
  pay: false,
  next: open
    ? 'วางรหัสตัวเลขจาก Outlook ลงไฟล์ แล้วรัน bot:worker โหมด real ในช่วงนี้'
    : 'ยังไม่อยู่ในช่วง 12:00–17:00 น. เวลาไทย ยังไม่ขอ OTP และยังไม่กดจ่าย'
}, null, 2))
