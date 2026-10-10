// logic ล้วนของ bot worker (แยกจาก I/O เพื่อ unit test)

export const FAULT_MODES = ['none', 'uid_invalid', 'provider_down', 'silent', 'random'] as const
export type FaultMode = typeof FAULT_MODES[number]

export type WorkerConfig = {
  apiUrl: string
  botKey: string
  mode: 'simulator' | 'real'
  fault: FaultMode
  pollMs: number
  heartbeatMs: number
  workMinMs: number
  workMaxMs: number
  silentMs: number
}

export type TopupOutcome
  = | { kind: 'success' }
    | { kind: 'fail', errorCode: 'UID_INVALID' | 'PROVIDER_DOWN' }
    | { kind: 'silent' }

function positiveInt (env: Record<string, string | undefined>, key: string, fallback: number): number {
  const raw = env[key]
  if (raw === undefined || raw === '') return fallback
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} ต้องเป็นตัวเลขมากกว่า 0 (ได้ "${raw}")`)
  }
  return Math.floor(value)
}

export function parseWorkerConfig (env: Record<string, string | undefined>): WorkerConfig {
  const botKey = env.BOT_KEY
  if (!botKey) {
    throw new Error('ต้องตั้ง BOT_KEY (apiKey จาก POST /api/v1/bots)')
  }

  const mode = env.BOT_MODE || 'simulator'
  if (mode === 'real') {
    if (env.BOT_REAL_ENABLED !== 'true') {
      throw new Error('BOT_MODE=real ต้อง opt-in ด้วย BOT_REAL_ENABLED=true (ค่าเริ่มต้นคือ simulator)')
    }
  } else if (mode !== 'simulator') {
    throw new Error(`BOT_MODE ไม่รองรับ "${mode}" (ใช้ simulator)`)
  }

  const fault = (env.BOT_FAULT || 'none') as FaultMode
  if (!FAULT_MODES.includes(fault)) {
    throw new Error(`BOT_FAULT ต้องเป็นหนึ่งใน ${FAULT_MODES.join(', ')} (ได้ "${fault}")`)
  }

  const workMinMs = positiveInt(env, 'BOT_WORK_MIN_MS', 3000)
  const workMaxMs = positiveInt(env, 'BOT_WORK_MAX_MS', 8000)
  if (workMinMs > workMaxMs) {
    throw new Error('BOT_WORK_MIN_MS ต้องไม่มากกว่า BOT_WORK_MAX_MS')
  }

  return {
    apiUrl: (env.BOT_API_URL || 'http://localhost:3000/api/v1').replace(/\/+$/, ''),
    botKey,
    mode: mode === 'real' ? 'real' : 'simulator',
    fault,
    pollMs: positiveInt(env, 'BOT_POLL_MS', 5000),
    heartbeatMs: positiveInt(env, 'BOT_HEARTBEAT_MS', 30000),
    workMinMs,
    workMaxMs,
    // ต้องนานกว่า LEASE (2 นาที) จึงจะเห็นออเดอร์ถูกคืนคิว
    silentMs: positiveInt(env, 'BOT_SILENT_MS', 150000)
  }
}

// rand ∈ [0,1) ส่งเข้ามาเพื่อให้ทดสอบได้แบบ deterministic
export function pickOutcome (fault: FaultMode, rand: number): TopupOutcome {
  switch (fault) {
    case 'uid_invalid':
      return { kind: 'fail', errorCode: 'UID_INVALID' }
    case 'provider_down':
      return { kind: 'fail', errorCode: 'PROVIDER_DOWN' }
    case 'silent':
      return { kind: 'silent' }
    case 'random':
      if (rand < 0.7) return { kind: 'success' }
      if (rand < 0.8) return { kind: 'fail', errorCode: 'UID_INVALID' }
      if (rand < 0.9) return { kind: 'fail', errorCode: 'PROVIDER_DOWN' }
      return { kind: 'silent' }
    default:
      return { kind: 'success' }
  }
}

export function randomBetween (min: number, max: number, rand: number): number {
  return Math.floor(min + rand * (max - min))
}
