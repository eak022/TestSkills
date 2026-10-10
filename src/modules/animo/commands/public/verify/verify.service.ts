import { BadRequestError, ForbiddenError } from '@/libs/middlewares/error-handler/domain'
import {
  ANIIMO_VERIFY_ERRORS,
  AniimoVerifyError,
  CAPTURED_ANIIMO_ROLES,
  classifyAniimoUpstream,
  findCharacterByUidAndServer,
  type AniimoRole,
  type AniimoVerifiedCharacter
} from '@/libs/utils/animo-verify.util'
import { type VerifyAnimoModel } from './verify.model'

const ROLES_URL = 'https://worldx-office-api.aniimo.com/api/player/roles'

function mapVerifyError (error: AniimoVerifyError): never {
  if (error.errorCode === ANIIMO_VERIFY_ERRORS.ANIIMO_CAPTCHA) {
    throw new ForbiddenError(error.message)
  }
  if (
    error.errorCode === ANIIMO_VERIFY_ERRORS.UID_INVALID
    || error.errorCode === ANIIMO_VERIFY_ERRORS.SERVER_MISMATCH
  ) {
    throw new BadRequestError(error.message)
  }
  throw error
}

export class VerifyAnimoService {
  async verify (body: VerifyAnimoModel.request): Promise<AniimoVerifiedCharacter> {
    try {
      const roles = await this.loadRoles()
      return findCharacterByUidAndServer(roles, body.uid, body.server)
    } catch (error) {
      if (error instanceof AniimoVerifyError) {
        mapVerifyError(error)
      }
      throw error
    }
  }

  private async loadRoles (): Promise<AniimoRole[]> {
    const mode = (process.env.ANIIMO_MODE ?? 'captured').trim().toLowerCase()
    if (mode !== 'live') {
      return CAPTURED_ANIIMO_ROLES
    }

    const token = process.env.ANIIMO_BEARER?.trim()
    if (!token) {
      throw new AniimoVerifyError(
        ANIIMO_VERIFY_ERRORS.ANIIMO_UNAVAILABLE,
        'ANIIMO_UNAVAILABLE: โหมด live ต้องตั้ง ANIIMO_BEARER ใน .env'
      )
    }

    let response: Response
    try {
      response = await fetch(ROLES_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Region: 'en'
        }
      })
    } catch {
      throw new AniimoVerifyError(
        ANIIMO_VERIFY_ERRORS.ANIIMO_UNAVAILABLE,
        'ANIIMO_UNAVAILABLE: เรียกร้านไม่ได้'
      )
    }

    const text = await response.text()
    const classified = classifyAniimoUpstream(response.status, text)
    if (classified) {
      throw new AniimoVerifyError(classified, `${classified}: ร้านตอบ ${response.status}`)
    }

    let parsed: { data?: { roles?: AniimoRole[] } }
    try {
      parsed = JSON.parse(text) as { data?: { roles?: AniimoRole[] } }
    } catch {
      throw new AniimoVerifyError(
        ANIIMO_VERIFY_ERRORS.ANIIMO_UNAVAILABLE,
        'ANIIMO_UNAVAILABLE: ร้านตอบไม่ใช่ JSON'
      )
    }

    return parsed.data?.roles ?? []
  }
}
