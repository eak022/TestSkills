const { chromium } = require('playwright')

;(async () => {
  const email = process.env.MIDASBUY_EMAIL
  const password = process.env.MIDASBUY_PASSWORD
  if (!email || !password) throw new Error('MISSING_SECRET')

  const browser = await chromium.launch({ channel: 'chrome', headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  const login = page.locator('iframe[name="iframe-window"]').contentFrame()

  await page.goto('https://www.midasbuy.com/midasbuy/jp/shop')
  await page.getByRole('button', { name: '閉じる' }).click()
  await page.locator('i').nth(4).click()
  await page.locator('div').filter({ hasText: /^サインイン \/ サインアップ$/ }).nth(3).click()
  await login.getByRole('textbox').fill(email)
  await login.getByText('続ける').click()
  await login.getByRole('textbox', { name: 'パスワードを入力' }).fill(password)
  await login.getByText('サインイン', { exact: true }).click()
  await page.getByRole('button', { name: '閉じる' }).click()
  await page.getByRole('img', { name: 'Age of Empires Mobile' }).click()
  await page.getByRole('button', { name: '閉じる' }).click()
  await page.locator('.MidasbuyUI-main_box_26a0a0').filter({ hasText: '99' }).filter({ hasText: '109' }).filter({ hasText: '146円' }).first().click()
  await page.locator('iframe').nth(2).contentFrame().locator('div').filter({ hasText: /^BitCash$/ }).nth(3).click()

  // ขั้นถัดไปในบันทึกคือปุ่ม お支払額： มันเปิดหน้าต่าง Bitcash จริง จึงไม่กดในไฟล์นี้
  console.log(JSON.stringify({ stopped: 'bitcash_selected', pay: false }))

  await context.close()
  await browser.close()
})()
