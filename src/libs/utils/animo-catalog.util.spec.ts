import { describe, expect, it } from 'bun:test'
import { ANIIMO_VERIFY_ERRORS, AniimoVerifyError } from './animo-verify.util'
import { buildPlaceOrderDraft, findCapturedPack, mycardPointsForPack } from './animo-catalog.util'

describe('animo twd catalog', () => {
  it('quotes the 300 crystal pack at the captured TWD price', () => {
    const item = findCapturedPack('com.x.aniimos.2.1.30')
    expect(item.price).toBe(138)
    expect(item.originalPrice).toBe(150)
    expect(item.discountAmount).toBe(12)
    expect(item.bonusCoin).toBe(30)
    expect(item.currency).toBe('TWD')
  })

  it('locks payment to the captured MyCard Points channel', () => {
    const payment = mycardPointsForPack(findCapturedPack('com.x.aniimos.2.1.30'))
    expect(payment.channelId).toBe('mycard')
    expect(payment.channelName).toBe('MyCard Points')
    expect(payment.subChannelId).toBe('COSTPOINT')
    expect(payment.price).toBe(138)
    expect(payment.extraFeeAmount).toBe(0)
  })

  it('builds the captured MyCard place_order body without session secrets', () => {
    const draft = buildPlaceOrderDraft(4, findCapturedPack('com.x.aniimos.2.1.30'))
    expect(draft.channel_id).toBe('mycard')
    expect(draft.sub_channel_id).toBe('COSTPOINT')
    expect(draft.price).toBe(138)
    expect(draft.discount_price).toBe(138)
    expect(draft.server_id).toBe(4)
    expect(draft.pay_info).toEqual({ package_id: '290002', product_type: 1 })
    expect(draft.act_type).toBe('month_first_discount')
    expect(draft).not.toHaveProperty('openid')
  })

  it('uses the captured final price of the 60 crystal pack', () => {
    const draft = buildPlaceOrderDraft(4, findCapturedPack('com.x.aniimos.2.1.6'))
    expect(draft.price).toBe(28)
    expect(draft.name).toBe('60 Lumin Crystals')
  })

  it('rejects a product id that was not in the TWD capture', () => {
    try {
      findCapturedPack('com.x.aniimos.unknown')
      throw new Error('expected missing pack')
    } catch (error) {
      expect(error).toBeInstanceOf(AniimoVerifyError)
      expect((error as AniimoVerifyError).errorCode).toBe(ANIIMO_VERIFY_ERRORS.PACK_NOT_FOUND)
    }
  })
})
