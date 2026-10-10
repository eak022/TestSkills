import { t } from 'elysia'

export const animoPackSchema = t.Object({
  productId: t.String({
    example: 'com.x.aniimos.2.1.30',
    description: 'product_id จาก game_products ใน POST /api/store/init'
  }),
  name: t.String({ example: '300 Lumin Crystals' }),
  coin: t.Number({ example: 300, description: 'จำนวน Lumin Crystals ของแพ็ก แพ็กพาสเป็น 0' }),
  bonusCoin: t.Number({ example: 30, description: 'โบนัสปกติจาก benefit level_normal_rebate' }),
  firstPurchaseBonusCoin: t.Number({ example: 300, description: 'โบนัสซื้อครั้งแรกจาก level_first_rebate' }),
  currency: t.Literal('TWD', { example: 'TWD', description: 'สกุลเงินจาก get_ip_currency ตอนทางออกเน็ตไต้หวัน' }),
  originalPrice: t.Number({ example: 150 }),
  price: t.Number({ example: 138, description: 'final_price หลังส่วนลดเดือนแรก' }),
  discountAmount: t.Number({ example: 12 }),
  discountRate: t.Number({ example: 0.92, description: 'final_discount ที่ร้านส่งใน place_order แพ็กพาสเป็น 1' }),
  packageId: t.String({ example: '290002', description: 'package_id ที่ร้านส่งมากับสินค้า' }),
  productType: t.Number({ example: 1, description: 'product_type ใน pay_info คริสตัลเป็น 1 พาสรายเดือนเป็น 2 คู่มือเป็น 3' })
})

export const animoPaymentSchema = t.Object({
  channelId: t.Literal('mycard', { example: 'mycard' }),
  channelName: t.Literal('MyCard Points', { example: 'MyCard Points' }),
  displayName: t.Literal('MyCard Points', { example: 'MyCard Points' }),
  subChannelId: t.Literal('COSTPOINT', {
    example: 'COSTPOINT',
    description: 'sub_channel_id ของ MyCard Points จาก POST /api/store/cal_final'
  }),
  extraFeeAmount: t.Literal(0, { example: 0 }),
  currency: t.Literal('TWD', { example: 'TWD' }),
  price: t.Number({ example: 138, description: 'ราคาที่ช่องนี้แสดงใน cal_final ของแพ็กที่เลือก' })
})

export const animoCharacterSchema = t.Object({
  uid: t.String({ example: '412000837577', description: 'roleId ที่ร้านยืนยัน' }),
  characterName: t.String({ example: 'Inbalckk555' }),
  server: t.String({ example: 'Aniimo-Apac', description: 'serverAreaName' }),
  serverId: t.Number({ example: 4, description: 'serverArea ที่ร้านส่งเป็น server_id' }),
  level: t.String({ example: '14' }),
  country: t.String({ example: 'TH', description: 'ประเทศในข้อมูลตัวละคร คนละฟิลด์กับประเทศของราคา' }),
  regionName: t.String({ example: '100' })
})

export namespace QuoteAnimoModel {
  export const packsResponse = t.Object({
    country: t.Literal('TW', {
      example: 'TW',
      description: 'ประเทศจาก get_ip_currency ของเซสชันที่เห็นราคา TWD'
    }),
    currency: t.Literal('TWD', { example: 'TWD' }),
    currencySymbol: t.Literal('TWD', { example: 'TWD' }),
    packs: t.Array(animoPackSchema)
  })
  export type packsResponse = typeof packsResponse.static

  export const request = t.Object({
    uid: t.String({
      minLength: 1,
      example: '412000837577',
      description: 'UID ของคนที่จะเติม = roleId จาก GET /api/player/roles'
    }),
    server: t.String({
      minLength: 1,
      example: 'Aniimo-Apac',
      description: 'serverAreaName หรือรหัส serverArea เช่น 4'
    }),
    productId: t.String({
      minLength: 1,
      example: 'com.x.aniimos.2.1.30',
      description: 'ได้จาก GET /api/v1/animo/packs → packs[].productId'
    })
  })
  export type request = typeof request.static

  export const response = t.Object({
    character: animoCharacterSchema,
    pack: animoPackSchema,
    payment: animoPaymentSchema,
    submitted: t.Literal(false, {
      example: false,
      description: 'ยังไม่เรียก POST /api/place_order และยังไม่จ่ายเงิน'
    })
  })
  export type response = typeof response.static
}
