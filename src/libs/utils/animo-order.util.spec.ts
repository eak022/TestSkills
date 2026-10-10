import { describe, expect, it } from 'bun:test'
import { isValidAniimoOrderNo, mapAniimoOrder } from './animo-order.util'

describe('aniimo order', () => {
  it('accepts an Aniimo order number and rejects the shop order number', () => {
    expect(isValidAniimoOrderNo('ANM-0000000000001')).toBe(true)
    expect(isValidAniimoOrderNo('ORD-0000000000001')).toBe(false)
  })

  it('maps a stored row back to the captured TWD pack and MyCard channel', () => {
    const view = mapAniimoOrder({
      orderNo: 'ANM-0000000000001',
      status: 'DRAFT',
      submitted: false,
      uid: '412000837577',
      characterName: 'Inbalckk555',
      server: 'Aniimo-Apac',
      serverId: 4,
      level: '14',
      country: 'TH',
      regionName: '100',
      productId: 'com.x.aniimos.2.1.30',
      productName: '300 Lumin Crystals',
      packageId: '290002',
      productType: 1,
      coin: 300,
      bonusCoin: 30,
      firstPurchaseBonusCoin: 300,
      currency: 'TWD',
      originalPrice: 150,
      price: 138,
      discountAmount: 12,
      discountRate: { toString: () => '0.92' },
      channelId: 'mycard',
      channelName: 'MyCard Points',
      subChannelId: 'COSTPOINT',
      paymentHost: 'https://fp-payment-worldx.kingsgroupgames.com',
      payUrl: null,
      createdAt: new Date('2026-10-09T13:00:00.000Z'),
      updatedAt: new Date('2026-10-09T13:00:00.000Z')
    })

    expect(view.orderNo).toBe('ANM-0000000000001')
    expect(view.status).toBe('DRAFT')
    expect(view.submitted).toBe(false)
    expect(view.payUrl).toBeNull()
    expect(view.pack.price).toBe(138)
    expect(view.pack.discountRate).toBe(0.92)
    expect(view.payment.subChannelId).toBe('COSTPOINT')
    expect(view.character.characterName).toBe('Inbalckk555')
  })
})
