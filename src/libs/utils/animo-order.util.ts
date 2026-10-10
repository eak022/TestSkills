import { ANIIMO_PAYMENT_HOST, type AniimoPack } from './animo-catalog.util'
import { type AniimoVerifiedCharacter } from './animo-verify.util'

export const ANIIMO_ORDER_NO_PREFIX = 'ANM-'
export const ANIIMO_ORDER_NO_DIGITS = 13
export const ANIIMO_ORDER_NO_PATTERN = new RegExp(`^${ANIIMO_ORDER_NO_PREFIX}\\d{${ANIIMO_ORDER_NO_DIGITS}}$`)

export function isValidAniimoOrderNo (orderNo: string): boolean {
  return ANIIMO_ORDER_NO_PATTERN.test(orderNo)
}

export type AniimoOrderRow = {
  orderNo: string
  status: 'DRAFT'
  submitted: boolean
  uid: string
  characterName: string
  server: string
  serverId: number
  level: string
  country: string
  regionName: string
  productId: string
  productName: string
  packageId: string
  productType: number
  coin: number
  bonusCoin: number
  firstPurchaseBonusCoin: number
  currency: string
  originalPrice: number
  price: number
  discountAmount: number
  discountRate: { toString: () => string }
  channelId: string
  channelName: string
  subChannelId: string
  paymentHost: string
  payUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export type AniimoOrderView = {
  orderNo: string
  status: 'DRAFT'
  submitted: false
  payUrl: null
  paymentHost: typeof ANIIMO_PAYMENT_HOST
  createdAt: Date
  updatedAt: Date
  character: AniimoVerifiedCharacter
  pack: AniimoPack
  payment: {
    channelId: 'mycard'
    channelName: 'MyCard Points'
    displayName: 'MyCard Points'
    subChannelId: 'COSTPOINT'
    extraFeeAmount: 0
    currency: 'TWD'
    price: number
  }
}

export function mapAniimoOrder (row: AniimoOrderRow): AniimoOrderView {
  return {
    orderNo: row.orderNo,
    status: 'DRAFT',
    submitted: false,
    payUrl: null,
    paymentHost: ANIIMO_PAYMENT_HOST,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    character: {
      uid: row.uid,
      characterName: row.characterName,
      server: row.server,
      serverId: row.serverId,
      level: row.level,
      country: row.country,
      regionName: row.regionName
    },
    pack: {
      productId: row.productId,
      name: row.productName,
      coin: row.coin,
      bonusCoin: row.bonusCoin,
      firstPurchaseBonusCoin: row.firstPurchaseBonusCoin,
      currency: 'TWD',
      originalPrice: row.originalPrice,
      price: row.price,
      discountAmount: row.discountAmount,
      discountRate: Number(row.discountRate),
      packageId: row.packageId,
      productType: row.productType as AniimoPack['productType']
    },
    payment: {
      channelId: 'mycard',
      channelName: 'MyCard Points',
      displayName: 'MyCard Points',
      subChannelId: 'COSTPOINT',
      extraFeeAmount: 0,
      currency: 'TWD',
      price: row.price
    }
  }
}
