const { mkdirSync } = require('node:fs')
const { join } = require('node:path')
const { chromium } = require('playwright')

function packTextOk (text) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim()
  return /(?:^|[^\d])99\s*\+\s*109(?:[^\d]|$)/.test(flat) && /(?:^|[^\d])146\s*円/.test(flat)
}

async function findBitCash (page) {
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const options = frame.locator('div').filter({ hasText: /^BitCash$/ })
      const count = await options.count().catch(() => 0)
      for (let i = count - 1; i >= 0; i--) {
        const option = options.nth(i)
        if (await option.isVisible().catch(() => false)) return { frame, option }
      }
    }
    await page.waitForTimeout(400)
  }
  throw new Error('Timeout waiting for BitCash')
}

async function clickIfVisible (locator) {
  try {
    await locator.click({ timeout: 4000 })
  } catch {
    // แบนเนอร์ 閉じる ไม่ขึ้นทุกครั้ง
  }
}

async function saveBitcashLoginShot (popup) {
  const dir = process.env.AOEM_RECEIPT_DIR || join(process.cwd(), 'data', 'aoem-receipts')
  mkdirSync(dir, { recursive: true })
  const orderNo = String(process.env.AOEM_ORDER_NO || 'preview').replace(/[^\w-]/g, '') || 'preview'
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = join(dir, `${orderNo}-bitcash-login-${stamp}.png`)
  await popup.screenshot({ path: file, fullPage: true })
  return file
}

function finish (result) {
  const safe = { ...result, pay: false, otpRequested: false }
  if (safe.popupUrl) {
    const url = new URL(safe.popupUrl)
    safe.popupHost = url.host
    safe.popupPath = url.pathname
    delete safe.popupUrl
  }
  console.log(JSON.stringify(safe))
}

async function main () {
  const email = process.env.MIDASBUY_EMAIL?.trim()
  const password = process.env.MIDASBUY_PASSWORD
  if (!email || !password) {
    finish({ action: 'wait', reason: 'MISSING_SECRET' })
    return
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await page.goto('https://www.midasbuy.com/midasbuy/jp/')
    if (!page.url().includes('/jp/')) {
      finish({ action: 'fail', errorCode: 'REGION_MISMATCH' })
      return
    }
    await clickIfVisible(page.getByRole('button', { name: '閉じる' }))
    await page.locator('i').nth(4).click()
    await page.locator('div').filter({ hasText: /^サインイン \/ サインアップ$/ }).nth(3).click()

    const login = page.locator('iframe[name="iframe-window"]').contentFrame()
    const emailBox = login.getByRole('textbox').first()
    await emailBox.click()
    await emailBox.fill(email)
    await login.getByText('続ける').click()
    const passwordBox = login.getByRole('textbox', { name: 'パスワードを入力' })
    await passwordBox.click()
    await passwordBox.fill(password)
    await login.getByRole('img').nth(4).click()
    await login.getByText('サインイン', { exact: true }).click()
    const passkeyClose = login.getByRole('img').first()
    await passkeyClose.waitFor({ state: 'visible', timeout: 15000 })
    await passkeyClose.click()
    await clickIfVisible(page.getByRole('button', { name: '閉じる' }))
    await clickIfVisible(page.locator('div').filter({ hasText: /^すべてのオプションのCookieを受け入れる$/ }).nth(3))

    await page.getByRole('img', { name: 'Age of Empires Mobile' }).click()
    await page.waitForURL(/\/jp\/shop\/aoem/, { timeout: 20000 })
    await clickIfVisible(page.getByRole('button', { name: '閉じる' }))

    const pack = page.locator('.MidasbuyUI-main_box_26a0a0').first()
    await pack.waitFor({ state: 'visible', timeout: 15000 })
    const packText = await pack.innerText().catch(() => '')
    const packFlat = String(packText || '').replace(/\s+/g, ' ').trim()
    if (packFlat && !packTextOk(packFlat)) {
      finish({ action: 'fail', errorCode: 'PACK_NOT_FOUND', stopped: 'pack', detail: packFlat.slice(0, 180) })
      return
    }
    await pack.click()
    const { frame: payFrame, option: bitcash } = await findBitCash(page)
    await bitcash.click()
    const popupPromise = page.waitForEvent('popup')
    await payFrame.getByRole('button', { name: 'お支払額：' }).click()
    const popup = await popupPromise
    await popup.waitForURL(/settle\.bitcash\.co\.jp/, { timeout: 45000 })
    await popup.getByRole('link', { name: /マイビットキャッシュで支払う/ }).click()
    const bitcashId = process.env.BITCASH_ID?.trim()
    const bitcashPassword = process.env.BITCASH_PASSWORD
    if (!bitcashId || !bitcashPassword) {
      finish({ action: 'wait', reason: 'MISSING_SECRET', stopped: 'bitcash_login', popupUrl: popup.url() })
      return
    }
    const member = popup.locator('#membersId')
    await member.click()
    await member.fill(bitcashId)
    const bitcashPasswordBox = popup.locator('#password')
    await bitcashPasswordBox.click()
    await bitcashPasswordBox.fill(bitcashPassword)
    await popup.waitForTimeout(500)
    const shot = await saveBitcashLoginShot(popup)
    finish({
      action: 'wait',
      reason: 'UI_UNSEEN',
      stopped: 'bitcash_login_filled',
      popupUrl: popup.url(),
      screenshot: shot
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/captcha|recaptcha|hcaptcha/i.test(message)) {
      finish({ action: 'fail', errorCode: 'CAPTCHA', detail: message.slice(0, 180) })
      return
    }
    if (/Timeout/i.test(message)) {
      finish({ action: 'fail', errorCode: 'SELECTOR_CHANGED', detail: message.slice(0, 180) })
      return
    }
    finish({ action: 'wait', reason: 'CHECK_INCOMPLETE', detail: message.slice(0, 180) })
  } finally {
    await context.close()
    await browser.close()
  }
}

main()
