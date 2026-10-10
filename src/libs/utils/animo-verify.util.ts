export const ANIIMO_VERIFY_ERRORS = {
  UID_INVALID: 'UID_INVALID',
  SERVER_MISMATCH: 'SERVER_MISMATCH',
  PACK_NOT_FOUND: 'PACK_NOT_FOUND',
  ANIIMO_CAPTCHA: 'ANIIMO_CAPTCHA',
  ANIIMO_RATE_LIMITED: 'ANIIMO_RATE_LIMITED',
  ANIIMO_UNAVAILABLE: 'ANIIMO_UNAVAILABLE'
} as const

export type AniimoVerifyErrorCode = typeof ANIIMO_VERIFY_ERRORS[keyof typeof ANIIMO_VERIFY_ERRORS]

export type AniimoRole = {
  roleId: string
  roleName: string
  nickname?: string
  serverArea: number | string
  serverAreaName: string
  level?: string
  country?: string
  regionName?: string
}

export type AniimoVerifiedCharacter = {
  uid: string
  characterName: string
  server: string
  serverId: number
  level: string
  country: string
  regionName: string
}

/** ตัวละครของบัญชีที่จะเติม — เก็บจาก GET /api/player/roles ของเซสชันทดสอบ ไม่ใส่ token */
export const CAPTURED_ANIIMO_ROLES: AniimoRole[] = [
  {
    roleId: '412000837577',
    roleName: 'Inbalckk555',
    nickname: 'Inbalckk555',
    serverArea: 4,
    serverAreaName: 'Aniimo-Apac',
    level: '14',
    country: 'TH',
    regionName: '100'
  }
]

export class AniimoVerifyError extends Error {
  constructor (public readonly errorCode: AniimoVerifyErrorCode, message: string) {
    super(message)
    this.name = 'AniimoVerifyError'
  }
}

export function normalizeUid (uid: string): string {
  return uid.trim()
}

export function normalizeServer (server: string): string {
  return server.trim().toLowerCase()
}

export function roleMatchesServer (role: AniimoRole, server: string): boolean {
  const expected = normalizeServer(server)
  return String(role.serverArea) === expected
    || normalizeServer(role.serverAreaName) === expected
}

export function mapRoleToCharacter (role: AniimoRole): AniimoVerifiedCharacter {
  return {
    uid: String(role.roleId),
    characterName: role.roleName || role.nickname || '',
    server: role.serverAreaName,
    serverId: Number(role.serverArea),
    level: role.level ?? '',
    country: role.country ?? '',
    regionName: role.regionName ?? ''
  }
}

export function findCharacterByUidAndServer (roles: AniimoRole[], uid: string, server: string): AniimoVerifiedCharacter {
  const expectedUid = normalizeUid(uid)
  const withUid = roles.filter((role) => String(role.roleId) === expectedUid)

  if (withUid.length === 0) {
    throw new AniimoVerifyError(
      ANIIMO_VERIFY_ERRORS.UID_INVALID,
      'UID_INVALID: ไม่พบตัวละครสำหรับ UID นี้'
    )
  }

  const matched = withUid.find((role) => roleMatchesServer(role, server))
  if (!matched) {
    throw new AniimoVerifyError(
      ANIIMO_VERIFY_ERRORS.SERVER_MISMATCH,
      'SERVER_MISMATCH: UID นี้ไม่มีตัวละครบนเซิร์ฟเวอร์ที่ส่งมา'
    )
  }

  return mapRoleToCharacter(matched)
}

export function classifyAniimoUpstream (status: number, bodyText: string): AniimoVerifyErrorCode | null {
  const text = bodyText.toLowerCase()
  if (status === 429 || /rate.?limit|too many/i.test(text)) {
    return ANIIMO_VERIFY_ERRORS.ANIIMO_RATE_LIMITED
  }
  if (/captcha/i.test(text)) {
    return ANIIMO_VERIFY_ERRORS.ANIIMO_CAPTCHA
  }
  if (status >= 500 || status === 401 || status === 403) {
    return ANIIMO_VERIFY_ERRORS.ANIIMO_UNAVAILABLE
  }
  return null
}
