import { BadRequestError, ForbiddenError } from '@/libs/middlewares/error-handler/domain'
import {
  CAPTURED_TWD_PACKS,
  findCapturedPack,
  mycardPointsForPack
} from '@/libs/utils/animo-catalog.util'
import {
  ANIIMO_VERIFY_ERRORS,
  AniimoVerifyError
} from '@/libs/utils/animo-verify.util'
import { VerifyAnimoService } from '../verify/verify.service'
import { type QuoteAnimoModel } from './quote.model'

function mapQuoteError (error: AniimoVerifyError): never {
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

export class QuoteAnimoService {
  constructor (private readonly verifyService = new VerifyAnimoService()) {}

  listPacks (): QuoteAnimoModel.packsResponse {
    return {
      country: 'TW',
      currency: 'TWD',
      currencySymbol: 'TWD',
      packs: CAPTURED_TWD_PACKS
    }
  }

  async quote (body: QuoteAnimoModel.request): Promise<QuoteAnimoModel.response> {
    try {
      const character = await this.verifyService.verify({
        uid: body.uid,
        server: body.server
      })
      const item = findCapturedPack(body.productId)
      return {
        character,
        pack: item,
        payment: mycardPointsForPack(item),
        submitted: false
      }
    } catch (error) {
      if (error instanceof AniimoVerifyError) {
        mapQuoteError(error)
      }
      throw error
    }
  }
}
