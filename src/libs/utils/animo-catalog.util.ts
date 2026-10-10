import { ANIIMO_VERIFY_ERRORS, AniimoVerifyError } from './animo-verify.util'

/** แพ็กจาก game_products ของ store/init ตอนทางออกเน็ตไต้หวัน สกุลเงิน TWD */
export type AniimoPack = {
  productId: string
  name: string
  coin: number
  bonusCoin: number
  firstPurchaseBonusCoin: number
  currency: 'TWD'
  originalPrice: number
  price: number
  discountAmount: number
  discountRate: number
  packageId: string
  productType: 1 | 2 | 3
}

/** ช่องที่โจทย์ล็อก มาจาก cal_final ของแพ็ก 300 ตอนเลือก MyCard Points */
export type AniimoMycardPoints = {
  channelId: 'mycard'
  channelName: 'MyCard Points'
  displayName: 'MyCard Points'
  subChannelId: 'COSTPOINT'
  extraFeeAmount: 0
  currency: 'TWD'
  price: number
}

export const CAPTURED_TWD_PACKS: AniimoPack[] = [
  pack('com.x.aniimos.2.1.6', '60 Lumin Crystals', 60, 6, 60, 30, 28, '290001', 1, 0.92),
  pack('com.x.aniimos.2.1.30', '300 Lumin Crystals', 300, 30, 300, 150, 138, '290002', 1, 0.92),
  pack('com.x.aniimos.2.1.98', '980 Lumin Crystals', 980, 98, 980, 490, 451, '290003', 1, 0.92),
  pack('com.x.aniimos.2.1.1980', '1980 Lumin Crystals', 1980, 198, 1980, 990, 911, '290004', 1, 0.92),
  pack('com.x.aniimos.2.1.3280', '3280 Lumin Crystals', 3280, 328, 3280, 1490, 1371, '290005', 1, 0.92),
  pack('com.x.aniimos.2.1.6480', '6480 Lumin Crystals', 6480, 648, 6480, 2990, 2751, '290006', 1, 0.92),
  pack('com.x.aniimos.2.2.30', 'Monthly Pass', 0, 0, 0, 150, 150, '290008', 2, 1),
  pack('com.x.aniimos.2.3.68', 'Advanced Companion Handbook', 0, 0, 0, 320, 320, '290009', 3, 1),
  pack('com.x.aniimos.2.3.128', "Collector's Companion Handbook", 0, 0, 0, 690, 690, '290010', 3, 1)
]

export const ANIIMO_PAYMENT_HOST = 'https://fp-payment-worldx.kingsgroupgames.com'

export type AniimoPlaceOrderDraft = {
  product_id: string
  payment_appid: '999002'
  name: string
  return_url: 'https://www.aniimo.com/store/en/'
  price: number
  channel_id: 'mycard'
  channel: 'MyCard Points'
  sub_channel_id: 'COSTPOINT'
  browser_info: { redirect_type: 'base' }
  pay_info: { package_id: string, product_type: 1 | 2 | 3 }
  custom_multiple: 1
  act_type: 'month_first_discount' | null
  discount: number
  discount_price: number
  server_id: number
  game_id: 999002
  game_project: 'worldx_global'
  source: 'web'
}

/** โครงที่ร้านส่งใน place_order ไม่ใส่ openid, browser_id, fp_device_id */
export function buildPlaceOrderDraft (serverId: number, item: AniimoPack): AniimoPlaceOrderDraft {
  return {
    product_id: item.productId,
    payment_appid: '999002',
    name: item.name,
    return_url: 'https://www.aniimo.com/store/en/',
    price: item.price,
    channel_id: 'mycard',
    channel: 'MyCard Points',
    sub_channel_id: 'COSTPOINT',
    browser_info: { redirect_type: 'base' },
    pay_info: { package_id: item.packageId, product_type: item.productType },
    custom_multiple: 1,
    act_type: item.discountAmount > 0 ? 'month_first_discount' : null,
    discount: item.discountRate,
    discount_price: item.price,
    server_id: serverId,
    game_id: 999002,
    game_project: 'worldx_global',
    source: 'web'
  }
}

export function findCapturedPack (productId: string): AniimoPack {
  const found = CAPTURED_TWD_PACKS.find((item) => item.productId === productId.trim())
  if (!found) {
    throw new AniimoVerifyError(
      ANIIMO_VERIFY_ERRORS.PACK_NOT_FOUND,
      'PACK_NOT_FOUND: ไม่มีแพ็กนี้ในรายการ TWD ที่แกะจากร้าน'
    )
  }
  return found
}

export function mycardPointsForPack (item: AniimoPack): AniimoMycardPoints {
  return {
    channelId: 'mycard',
    channelName: 'MyCard Points',
    displayName: 'MyCard Points',
    subChannelId: 'COSTPOINT',
    extraFeeAmount: 0,
    currency: 'TWD',
    price: item.price
  }
}

function pack (
  productId: string,
  name: string,
  coin: number,
  bonusCoin: number,
  firstPurchaseBonusCoin: number,
  originalPrice: number,
  price: number,
  packageId: string,
  productType: 1 | 2 | 3,
  discountRate: number
): AniimoPack {
  return {
    productId,
    name,
    coin,
    bonusCoin,
    firstPurchaseBonusCoin,
    currency: 'TWD',
    originalPrice,
    price,
    discountAmount: originalPrice - price,
    discountRate,
    packageId,
    productType
  }
}
