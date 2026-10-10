import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  AOEM_PLAYER_UID,
  isAllowedAoemPack,
  isHrOtpWindow,
  reconcileAoemPayment,
  type AoemReceipt,
  type AoemRunResult
} from '@/libs/utils/aoem-bot.util'
import { runRecordedFlow } from './run-recorded'

const RECEIPT_DIR = 'data/aoem-receipts'

type PurchaseInput = {
  orderNo: string
  playerUid: string
  packageName: string
  amount: number
  now: Date
  env: Record<string, string | undefined>
}

function receiptPath (orderNo: string): string {
  return join(RECEIPT_DIR, `${orderNo}.json`)
}

async function readReceipt (orderNo: string): Promise<AoemReceipt | null> {
  try {
    return JSON.parse(await readFile(receiptPath(orderNo), 'utf8')) as AoemReceipt
  } catch {
    return null
  }
}

async function saveReceipt (receipt: AoemReceipt): Promise<void> {
  await mkdir(RECEIPT_DIR, { recursive: true })
  await writeFile(receiptPath(receipt.orderNo), JSON.stringify(receipt, null, 2))
}

function blankReceipt (orderNo: string): AoemReceipt {
  return {
    orderNo,
    payClicked: false,
    bitcashBefore: null,
    bitcashAfter: null,
    invoiceAmount: null,
    invoiceNo: null,
    midasbuyPriceJpy: null
  }
}

export async function runAoemPurchase (input: PurchaseInput): Promise<AoemRunResult> {
  if (!isAllowedAoemPack(input.packageName, input.amount)) {
    return { action: 'fail', errorCode: 'PACK_NOT_FOUND' }
  }
  if (input.playerUid !== AOEM_PLAYER_UID) {
    return { action: 'fail', errorCode: 'UID_INVALID' }
  }
  if (!isHrOtpWindow(input.now)) {
    return { action: 'wait', reason: 'OUTSIDE_OTP_WINDOW' }
  }

  const existing = await readReceipt(input.orderNo)
  if (existing?.payClicked) {
    return reconcileAoemPayment(existing)
  }

  const email = input.env.MIDASBUY_EMAIL?.trim()
  const midasbuyPassword = input.env.MIDASBUY_PASSWORD
  const bitcashId = input.env.BITCASH_ID?.trim()
  const bitcashPassword = input.env.BITCASH_PASSWORD
  if (!email || !midasbuyPassword || !bitcashId || !bitcashPassword) {
    return { action: 'wait', reason: 'MISSING_SECRET' }
  }

  const receipt = existing ?? blankReceipt(input.orderNo)
  await saveReceipt(receipt)
  return await runRecordedFlow({
    ...input.env,
    AOEM_PLAYER_UID: input.playerUid,
    AOEM_ORDER_NO: input.orderNo
  })
}
