// บอทของ oxide-monitor-candidate-pack
// คำสั่งตามแพ็ก: start / stop / restart / status มากับ heartbeat (acceptingOrders)
// ค่าเริ่มต้น simulator ไม่ซื้อของ จ่ายจริงเฉพาะ BOT_MODE=real และ BOT_REAL_ENABLED=true
// รัน: BOT_KEY=bot_xxx bun run bot:worker
import { isHrOtpWindow } from '@/libs/utils/aoem-bot.util'
import { parseWorkerConfig, pickOutcome, randomBetween } from '@/libs/utils/bot-worker.util'

const config = parseWorkerConfig(process.env)

const startedAt = Date.now()
let muted = false // จำลองเครื่องล่ม: ไม่ส่ง heartbeat ใด ๆ
let killSwitch = false
let acceptingOrders = true
let stopping = false

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function log (message: string, extra: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), worker: 'bot-worker', message, ...extra }))
}

async function api (method: 'GET' | 'POST', path: string, body?: unknown) {
  const response = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: {
      'x-bot-key': config.botKey,
      ...(body === undefined ? {} : { 'content-type': 'application/json' })
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  })
  const data = await response.json().catch(() => null) as any
  return { status: response.status, data }
}

async function sendBotHeartbeat () {
  if (muted) return
  try {
    const { status, data } = await api('POST', '/bots/heartbeat', {
      cpuPercent: Number((5 + Math.random() * 30).toFixed(1)),
      memoryPercent: Number((30 + Math.random() * 20).toFixed(1)),
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000)
    })
    if (status === 401) {
      console.error('bot key ไม่ถูกต้องหรือถูกเพิกถอน — หยุดทำงาน')
      process.exit(1)
    }
    if (status !== 200) {
      log('bot_heartbeat_failed', { status, data })
      return
    }
    if (data.killSwitch !== killSwitch) {
      log(data.killSwitch ? 'kill_switch_on_stop_claiming' : 'kill_switch_off_resume')
    }
    killSwitch = Boolean(data.killSwitch)
    const nextAccepting = data.acceptingOrders !== false && !killSwitch
    if (nextAccepting !== acceptingOrders) {
      log(nextAccepting ? 'command_start_resume' : 'command_stop_pause')
    }
    acceptingOrders = nextAccepting
  } catch (error) {
    log('bot_heartbeat_error', { error: String(error) })
  }
}

async function processOrder (order: { orderNo: string, playerUid: string, packageName: string, amount: number | string }) {
  const orderNo = order.orderNo
  if (config.mode === 'real') {
    log('order_claimed', { orderNo, mode: 'real' })
    const orderHeartbeat = setInterval(() => {
      api('POST', `/orders/${orderNo}/heartbeat`)
        .then(({ status }) => log('order_heartbeat', { orderNo, status }))
        .catch((error) => log('order_heartbeat_error', { orderNo, error: String(error) }))
    }, config.heartbeatMs)
    let result
    try {
      const { runAoemPurchase } = await import('./purchase')
      result = await runAoemPurchase({
        orderNo,
        playerUid: order.playerUid,
        packageName: order.packageName,
        amount: Number(order.amount),
        now: new Date(),
        env: process.env
      })
    } finally {
      clearInterval(orderHeartbeat)
    }
    log('aoem_purchase_result', { orderNo, result })
    if (result.action === 'wait') {
      return
    }
    const body = result.action === 'complete'
      ? { result: 'SUCCESS' as const }
      : { result: 'FAIL' as const, errorCode: result.errorCode }
    const { status, data } = await api('POST', `/orders/${orderNo}/heartbeat`)
    log('order_heartbeat', { orderNo, status })
    const fulfilled = await api('POST', `/orders/${orderNo}/fulfill`, body)
    log('order_fulfill_reported', {
      orderNo,
      httpStatus: fulfilled.status,
      orderStatus: fulfilled.data?.status,
      sent: body,
      error: fulfilled.status >= 400 ? fulfilled.data : undefined,
      heartbeatStatus: status,
      heartbeatData: data
    })
    return
  }

  const outcome = pickOutcome(config.fault, Math.random())
  log('order_claimed', { orderNo, plannedOutcome: outcome.kind })

  if (outcome.kind === 'silent') {
    // ไม่ heartbeat ไม่ fulfill → lease หมด → cron คืนคิว / DELAYED
    muted = true
    log('simulating_crash', { orderNo, silentMs: config.silentMs })
    await sleep(config.silentMs)
    muted = false
    log('recovered_after_crash', { orderNo })
    return
  }

  const orderHeartbeat = setInterval(() => {
    if (muted) return
    api('POST', `/orders/${orderNo}/heartbeat`)
      .then(({ status }) => log('order_heartbeat', { orderNo, status }))
      .catch((error) => log('order_heartbeat_error', { orderNo, error: String(error) }))
  }, config.heartbeatMs)

  try {
    // dry-run: แค่รอแทนการกรอก UID / เลือกแพ็ก 99+109 Coin / จ่าย Bitcash
    await sleep(randomBetween(config.workMinMs, config.workMaxMs, Math.random()))
  } finally {
    clearInterval(orderHeartbeat)
  }

  const body = outcome.kind === 'success'
    ? { result: 'SUCCESS' }
    : { result: 'FAIL', errorCode: outcome.errorCode }
  const { status, data } = await api('POST', `/orders/${orderNo}/fulfill`, body)
  log('order_fulfill_reported', { orderNo, httpStatus: status, orderStatus: data?.status, sent: body, error: status >= 400 ? data : undefined })
}

async function main () {
  log('worker_start', {
    mode: config.mode,
    fault: config.fault,
    apiUrl: config.apiUrl,
    pollMs: config.pollMs,
    heartbeatMs: config.heartbeatMs
  })

  await sendBotHeartbeat()
  setInterval(() => {
    void sendBotHeartbeat()
  }, config.heartbeatMs)

  while (!stopping) {
    if (killSwitch || !acceptingOrders) {
      await sleep(config.pollMs)
      continue
    }

    if (config.mode === 'real' && !isHrOtpWindow(new Date())) {
      log('outside_otp_window_skip_claim')
      await sleep(config.pollMs)
      continue
    }

    try {
      const { status, data } = await api('POST', '/orders/claim')
      if (status === 409) {
        killSwitch = true
        log('claim_refused_kill_switch')
      } else if (status === 401) {
        console.error('bot key ไม่ถูกต้องหรือถูกเพิกถอน — หยุดทำงาน')
        process.exit(1)
      } else if (status !== 200) {
        log('claim_failed', { status, data })
      } else if (data.claimed && data.order) {
        await processOrder(data.order)
        continue
      }
    } catch (error) {
      log('claim_error', { error: String(error) })
    }
    await sleep(config.pollMs)
  }
}

process.on('SIGINT', () => {
  log('worker_stopping')
  stopping = true
  // ถ้ากำลังทำออเดอร์ให้จบก่อน แต่ไม่รอเกิน 15 วิ
  setTimeout(() => process.exit(0), 15000).unref()
})

void main()
