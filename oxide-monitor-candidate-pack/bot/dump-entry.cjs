const { chromium } = require('playwright')

async function main () {
  const browser = await chromium.launch({ channel: 'chrome', headless: false })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  const notes = []
  try {
    await page.goto('https://www.midasbuy.com/midasbuy/jp/shop', { waitUntil: 'domcontentloaded' })
    await page.getByText('すべてのゲーム').first().waitFor({ timeout: 15000 })

    const buttons = await page.getByRole('button').evaluateAll((nodes) => nodes.slice(0, 20).map((node) => ({
      name: (node.getAttribute('aria-label') || node.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      className: String(node.className).slice(0, 80)
    })))
    notes.push({ buttons })

    const cookieReject = page.getByRole('button', { name: 'すべてのオプションのCookieを拒否する' })
    notes.push({ cookieReject: await cookieReject.count() })
    if (await cookieReject.count()) {
      await cookieReject.first().click({ timeout: 8000 })
      notes.push({ cookie: 'rejected' })
    }

    const pwaClose = page.getByRole('button', { name: '閉じる' })
    if (await pwaClose.count() && await pwaClose.first().isVisible().catch(() => false)) {
      await pwaClose.first().click({ timeout: 8000 }).catch((error) => {
        notes.push({ pwaClose: String(error).slice(0, 180) })
      })
    }

    const headerSignIn = page.locator('div.MidasbuyUI-sign_in_d2aa02')
    notes.push({
      headerCount: await headerSignIn.count(),
      headerVisible: await headerSignIn.first().isVisible().catch(() => false)
    })
    await headerSignIn.first().click({ timeout: 8000 })
    await page.waitForTimeout(1500)

    const drawer = page.getByText('サインイン / サインアップ', { exact: true })
    const drawerCount = await drawer.count()
    const drawerVisible = []
    for (let i = 0; i < Math.min(drawerCount, 6); i++) {
      drawerVisible.push(await drawer.nth(i).isVisible().catch(() => false))
    }
    notes.push({ drawerCount, drawerVisible })

    const frames = []
    for (const frame of page.frames()) {
      const url = frame.url()
      if (!url || url === 'about:blank' || url === page.url()) continue
      const title = await frame.locator('p.title').first().innerText().catch(() => '')
      frames.push({ url: url.split('?')[0], title })
    }
    notes.push({ frames })
    await page.screenshot({ path: 'C:/Users/eakea/AppData/Local/Temp/aoem-signin.png', fullPage: false })
    console.log(JSON.stringify(notes, null, 2))
  } finally {
    await context.close()
    await browser.close()
  }
}

main().catch((error) => {
  console.error(String(error).slice(0, 800))
  process.exit(1)
})
