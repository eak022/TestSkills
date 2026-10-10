import { AOEM_PACK_LABEL, AOEM_PRICE_JPY, AOEM_SHOP_URL, AOEM_STEPS } from '@/libs/utils/aoem-bot.util'

console.log(JSON.stringify({
  mode: 'dry-run',
  shop: AOEM_SHOP_URL,
  pack: AOEM_PACK_LABEL,
  priceJpy: AOEM_PRICE_JPY,
  pay: false,
  codedThrough: 'ลำดับที่บันทึกจาก Chrome บน Windows จนเปิดหน้า Bitcash แล้วหยุดก่อน OTP และก่อนกดจ่าย',
  steps: AOEM_STEPS
}, null, 2))
