import { execFileSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import type { AoemRunResult } from '@/libs/utils/aoem-bot.util'

const WINDOWS_NODE = '/mnt/c/Users/eakea/AppData/Local/Temp/node-v22.21.1-win-x64/node.exe'
const recordedScript = fileURLToPath(new URL('./recorded.cjs', import.meta.url))

function nodeBinary (): string | null {
  if (process.platform === 'win32') return 'node'
  if (existsSync(WINDOWS_NODE)) return WINDOWS_NODE
  return null
}

function windowsPath (file: string): string {
  if (process.platform === 'win32') return file
  return execFileSync('wslpath', ['-w', file], { encoding: 'utf8' }).trim()
}

export function runRecordedFlow (env: Record<string, string | undefined>): Promise<AoemRunResult> {
  const node = nodeBinary()
  if (!node) return Promise.resolve({ action: 'wait', reason: 'BROWSER_MISSING' })
  const childEnv: NodeJS.ProcessEnv = { ...process.env }
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') childEnv[key] = value
  }
  const receiptDir = join(fileURLToPath(new URL('../..', import.meta.url)), 'data', 'aoem-receipts')
  if (!childEnv.AOEM_RECEIPT_DIR) childEnv.AOEM_RECEIPT_DIR = receiptDir
  const shared = ['MIDASBUY_EMAIL', 'MIDASBUY_PASSWORD', 'BITCASH_ID', 'BITCASH_PASSWORD', 'AOEM_PREVIEW', 'AOEM_PLAYER_UID', 'AOEM_ORDER_NO', 'AOEM_RECEIPT_DIR/p']
  const existing = (childEnv.WSLENV ?? '').split(':').filter(Boolean)
  childEnv.WSLENV = [...new Set([...existing, ...shared])].join(':')
  return new Promise((resolve) => {
    const child = spawn(node, [windowsPath(recordedScript)], {
      env: childEnv,
      stdio: ['ignore', 'pipe', 'inherit']
    })
    let stdout = ''
    child.stdout?.on('data', (chunk) => {
      const text = String(chunk)
      stdout += text
      process.stdout.write(text)
    })
    child.on('error', () => resolve({ action: 'wait', reason: 'BROWSER_MISSING' }))
    child.on('close', () => {
      const line = stdout.trim().split('\n').reverse().find((item) => item.startsWith('{'))
      if (!line) {
        resolve({ action: 'wait', reason: 'CHECK_INCOMPLETE' })
        return
      }
      try {
        resolve(JSON.parse(line) as AoemRunResult)
      } catch {
        resolve({ action: 'wait', reason: 'CHECK_INCOMPLETE' })
      }
    })
  })
}
