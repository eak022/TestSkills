import { prisma } from '@prisma/index'
import { BadRequestError, ForbiddenError } from '@/libs/middlewares/error-handler/domain'
import { ANIIMO_PAYMENT_HOST, findCapturedPack, mycardPointsForPack } from '@/libs/utils/animo-catalog.util'
import {
  ANIIMO_ORDER_NO_DIGITS,
  ANIIMO_ORDER_NO_PREFIX,
  mapAniimoOrder,
  type AniimoOrderRow
} from '@/libs/utils/animo-order.util'
import {
  ANIIMO_VERIFY_ERRORS,
  AniimoVerifyError
} from '@/libs/utils/animo-verify.util'
import { findAndCountIncreaseWithTransaction } from '@/libs/utils/find-and-count-increase.util'
import { generateRunningNumber } from '@/libs/utils/generate-running-number.util'
import { logOrder } from '@/libs/utils/order-logger.util'
import { type AniimoOrderRepository } from '@/repositories/aniimo-order.repository'
import { VerifyAnimoService } from '../verify/verify.service'
import { type OrderAnimoModel } from './order.model'

function mapOrderError (error: AniimoVerifyError): never {
  if (error.errorCode === ANIIMO_VERIFY_ERRORS.ANIIMO_CAPTCHA) {
    throw new ForbiddenError(error.message)
  }
  if (
    error.errorCode === ANIIMO_VERIFY_ERRORS.UID_INVALID
    || error.errorCode === ANIIMO_VERIFY_ERRORS.SERVER_MISMATCH
    || error.errorCode === ANIIMO_VERIFY_ERRORS.PACK_NOT_FOUND
  ) {
    throw new BadRequestError(error.message)
  }
  throw error
}

export class CreateAniimoOrderService {
  constructor (
    private readonly orderRepository: AniimoOrderRepository,
    private readonly verifyService = new VerifyAnimoService()
  ) {}

  async execute (body: OrderAnimoModel.request): Promise<OrderAnimoModel.response> {
    let character
    let pack
    try {
      character = await this.verifyService.verify({
        uid: body.uid,
        server: body.server
      })
      pack = findCapturedPack(body.productId)
    } catch (error) {
      if (error instanceof AniimoVerifyError) {
        mapOrderError(error)
      }
      throw error
    }

    const payment = mycardPointsForPack(pack)
    const created = await prisma.$transaction(async (tx) => {
      const countTable = await findAndCountIncreaseWithTransaction('aniimoOrder', tx)
      const orderNo = generateRunningNumber(ANIIMO_ORDER_NO_PREFIX, countTable.count, ANIIMO_ORDER_NO_DIGITS)
      return await this.orderRepository.create({
        data: {
          orderNo,
          status: 'DRAFT',
          submitted: false,
          uid: character.uid,
          characterName: character.characterName,
          server: character.server,
          serverId: character.serverId,
          level: character.level,
          country: character.country,
          regionName: character.regionName,
          productId: pack.productId,
          productName: pack.name,
          packageId: pack.packageId,
          productType: pack.productType,
          coin: pack.coin,
          bonusCoin: pack.bonusCoin,
          firstPurchaseBonusCoin: pack.firstPurchaseBonusCoin,
          currency: pack.currency,
          originalPrice: pack.originalPrice,
          price: pack.price,
          discountAmount: pack.discountAmount,
          discountRate: pack.discountRate,
          channelId: payment.channelId,
          channelName: payment.channelName,
          subChannelId: payment.subChannelId,
          paymentHost: ANIIMO_PAYMENT_HOST,
          payUrl: null
        }
      }, tx)
    })

    const result = mapAniimoOrder(created as AniimoOrderRow)
    logOrder(result.orderNo, 'create_aniimo_order', {
      status: result.status,
      uid: result.character.uid,
      productId: result.pack.productId
    })
    return result
  }
}
