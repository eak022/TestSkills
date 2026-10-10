import { describe, expect, it } from 'bun:test'
import {
  ANIIMO_VERIFY_ERRORS,
  CAPTURED_ANIIMO_ROLES,
  classifyAniimoUpstream,
  findCharacterByUidAndServer,
  AniimoVerifyError
} from './animo-verify.util'

describe('animo verify', () => {
  it('returns the character when uid and server match the shop roles list', () => {
    const character = findCharacterByUidAndServer(
      CAPTURED_ANIIMO_ROLES,
      '412000837577',
      'Aniimo-Apac'
    )
    expect(character.characterName).toBe('Inbalckk555')
    expect(character.serverId).toBe(4)
  })

  it('accepts serverArea number as server', () => {
    const character = findCharacterByUidAndServer(
      CAPTURED_ANIIMO_ROLES,
      '412000837577',
      '4'
    )
    expect(character.server).toBe('Aniimo-Apac')
  })

  it('rejects unknown uid', () => {
    expect(() => findCharacterByUidAndServer(CAPTURED_ANIIMO_ROLES, '000', 'Aniimo-Apac'))
      .toThrow(AniimoVerifyError)
    try {
      findCharacterByUidAndServer(CAPTURED_ANIIMO_ROLES, '000', 'Aniimo-Apac')
    } catch (error) {
      expect(error).toBeInstanceOf(AniimoVerifyError)
      expect((error as AniimoVerifyError).errorCode).toBe(ANIIMO_VERIFY_ERRORS.UID_INVALID)
    }
  })

  it('rejects known uid on the wrong server', () => {
    try {
      findCharacterByUidAndServer(CAPTURED_ANIIMO_ROLES, '412000837577', 'Aniimo-Taiwan')
      throw new Error('expected mismatch')
    } catch (error) {
      expect((error as AniimoVerifyError).errorCode).toBe(ANIIMO_VERIFY_ERRORS.SERVER_MISMATCH)
    }
  })

  it('classifies captcha and rate limit separately from shop outage', () => {
    expect(classifyAniimoUpstream(429, 'too many requests')).toBe(ANIIMO_VERIFY_ERRORS.ANIIMO_RATE_LIMITED)
    expect(classifyAniimoUpstream(403, 'captcha required')).toBe(ANIIMO_VERIFY_ERRORS.ANIIMO_CAPTCHA)
    expect(classifyAniimoUpstream(500, 'oops')).toBe(ANIIMO_VERIFY_ERRORS.ANIIMO_UNAVAILABLE)
    expect(classifyAniimoUpstream(200, '')).toBeNull()
  })
})
