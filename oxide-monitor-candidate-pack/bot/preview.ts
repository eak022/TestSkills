import { AOEM_PLAYER_UID } from '@/libs/utils/aoem-bot.util'
import { runRecordedFlow } from './run-recorded'

const email = process.env.MIDASBUY_EMAIL?.trim()
const password = process.env.MIDASBUY_PASSWORD
if (!email || !password) {
  console.log(JSON.stringify({ message: 'missing_secret', need: 'MIDASBUY_EMAIL และ MIDASBUY_PASSWORD ใน .env' }))
  process.exit(1)
}

const result = await runRecordedFlow({
  ...process.env,
  AOEM_PREVIEW: '1',
  AOEM_PLAYER_UID
})
process.exit(result.action === 'fail' || result.reason === 'CHECK_INCOMPLETE' ? 1 : 0)
