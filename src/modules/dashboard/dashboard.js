const tokenKey = 'dashboard.accessToken'
    const loginForm = document.querySelector('#login')
    const app = document.querySelector('#app')
    const toast = document.querySelector('#toast')
    const selected = new Set()
    let summary = null
    let codePackage = null


    function showToast (message) {
      toast.textContent = message
      toast.classList.remove('hidden')
      clearTimeout(showToast.timer)
      showToast.timer = setTimeout(() => toast.classList.add('hidden'), 4000)
    }

    async function api (path, options = {}) {
      const headers = { ...(options.headers || {}) }
      const token = sessionStorage.getItem(tokenKey)
      if (token) headers.Authorization = 'Bearer ' + token
      if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
      const response = await fetch(path, { ...options, headers })
      const raw = await response.text()
      let data = null
      try { data = raw ? JSON.parse(raw) : null } catch { data = { message: raw } }
      if (!response.ok) {
        const error = new Error(data?.message || 'คำขอไม่สำเร็จ')
        error.status = response.status
        throw error
      }
      return data
    }

    function formatSize (bytes) {
      const size = Number(bytes) || 0
      if (size >= 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB'
      return Math.max(1, Math.ceil(size / 1024)) + ' KB'
    }

    function workLabel (state) {
      if (state === 'in_progress') return 'กำลังทำงาน'
      if (state === 'standby') return 'รับงาน'
      if (state === 'stopped') return 'หยุด'
      return state || '-'
    }

    function render () {
      const killOn = Boolean(summary?.killSwitch)
      const killText = document.querySelector('#killText')
      killText.textContent = killOn
        ? 'ทั้งระบบ: ปิด — บอทไม่รับออเดอร์ใหม่'
        : 'ทั้งระบบ: เปิด — บอทที่ออนไลน์รับงานได้'
      killText.className = killOn ? 'halt' : 'live'
      document.querySelector('#killOff').className = killOn ? 'btn ghost' : 'btn live'
      document.querySelector('#killOn').className = killOn ? 'btn halt' : 'btn ghost'
      const versions = [...new Set((summary?.bots || []).map((bot) => bot.codeVersion).filter(Boolean))]
      const onBots = versions.length ? ' · บนเครื่อง ' + versions.join(', ') : ''
      document.querySelector('#packageText').textContent = codePackage
        ? 'แพ็กเกจล่าสุด: ' + codePackage.fileName + ' · ' + formatSize(codePackage.sizeBytes) + ' · ' + new Date(codePackage.uploadedAt).toLocaleString('th-TH') + ' · v' + codePackage.version + onBots
        : (versions.length ? 'แพ็กเกจล่าสุด: ยังไม่มีไฟล์ · บนเครื่อง ' + versions.join(', ') : 'แพ็กเกจล่าสุด: ยังไม่มีไฟล์')
      const stats = [
        ['เครื่องออนไลน์', summary?.onlineCount ?? 0],
        ['กำลังทำงาน', summary?.inProgress ?? 0],
        ['พร้อมรับงาน', summary?.standby ?? 0],
        ['ไม่ได้สั่งหยุด', summary?.active ?? 0]
      ]
      document.querySelector('#stats').innerHTML = stats.map(([label, value]) =>
        '<div class="stat"><span class="muted">' + label + '</span><b>' + value + '</b></div>'
      ).join('')
      const cards = document.querySelector('#cards')
      const bots = summary?.bots || []
      cards.innerHTML = bots.length ? '' : '<p class="muted">ยังไม่มีเครื่อง เปิด simulator หรือลงทะเบียนบอทก่อน</p>'
      for (const bot of bots) {
        const card = document.createElement('article')
        card.className = 'card' + (selected.has(bot.id) ? ' selected' : '')
        const online = bot.status === 'online'
        const job = bot.lastJobResult || 'ยังไม่มีงาน'
        const failed = /fail/i.test(job)
        card.innerHTML =
          '<header><div><div class="name"></div><div class="muted"></div></div><span class="badge"></span></header>' +
          '<div class="facts"><div><span>สถานะงาน</span><b class="work"></b></div><div><span>เครื่อง</span><b class="device"></b></div><div><span>งานล่าสุด</span><b class="job"></b></div></div>' +
          '<div class="actions"></div><div class="detail hidden"></div>'
        card.querySelector('.name').textContent = bot.name || bot.id
        card.querySelector('.muted').textContent = bot.id
        const badge = card.querySelector('.badge')
        badge.textContent = online ? 'ออนไลน์' : 'ออฟไลน์'
        if (!online) badge.classList.add('off')
        card.querySelector('.work').textContent = workLabel(bot.workState)
        card.querySelector('.device').textContent = bot.deviceName || '-'
        card.querySelector('.job').textContent = job
        if (failed) card.querySelector('.job').classList.add('bad')
        const actions = card.querySelector('.actions')
        const buttons = [
          ['เปิด', 'start', 'green'],
          ['ปิด', 'stop', 'stop'],
          ['รีสตาร์ท', 'restart', ''],
          ['รายงานผล', 'report', 'ghost'],
          ['อัปเดตโค้ด', 'update', 'ghost']
        ]
        for (const [label, action, kind] of buttons) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'btn ' + kind
          button.textContent = label
          button.addEventListener('click', (event) => {
            event.stopPropagation()
            onCardAction(bot, action, card)
          })
          actions.appendChild(button)
        }
        const detail = card.querySelector('.detail')
        detail.textContent = 'CPU ' + bot.cpuPercent + '% · RAM ' + bot.memoryPercent +
          '% · heartbeat ' + (bot.heartbeat ? new Date(bot.heartbeat).toLocaleString() : '-') +
          '\nเวอร์ชัน ' + (bot.codeVersion || '-') + ' · งานล่าสุด ' + job
        if (failed) detail.classList.add('bad')
        card.addEventListener('click', () => {
          if (selected.has(bot.id)) selected.delete(bot.id)
          else selected.add(bot.id)
          card.classList.toggle('selected')
        })
        cards.appendChild(card)
      }
    }

    async function refresh () {
      const [nextSummary, packageRes] = await Promise.all([
        api('/api/v1/bots/summary'),
        api('/api/v1/bots/packages/latest')
      ])
      summary = nextSummary
      codePackage = packageRes.package
      render()
    }

    async function onCardAction (bot, action, card) {
      try {
        if (action === 'report') {
          const detail = card.querySelector('.detail')
          detail.classList.toggle('hidden')
          if (!detail.classList.contains('hidden')) await loadLogs(bot, detail)
          return
        }
        if (action === 'update') {
          await pushUpdate([bot.id])
          return
        } else {
          const result = await api('/api/v1/bots/' + encodeURIComponent(bot.id) + '/commands', {
            method: 'POST',
            body: JSON.stringify({ command: action })
          })
          showToast(bot.id + ' ' + action + ' · ' + (result.status || 'ok'))
        }
        await refresh()
      } catch (error) {
        showToast(error.message)
      }
    }

    async function setKill (enabled) {
      try {
        await api('/api/v1/system/kill-switch', { method: 'POST', body: JSON.stringify({ enabled }) })
        showToast(enabled ? 'ปิดรับงานทั้งระบบแล้ว' : 'เปิดรับงานทั้งระบบแล้ว')
        await refresh()
      } catch (error) {
        showToast(error.message)
      }
    }

    async function loadLogs (bot, detail) {
      const metrics = detail.dataset.metrics || detail.textContent
      detail.dataset.metrics = metrics
      detail.textContent = metrics + '\nกำลังโหลด log...'
      try {
        const data = await api('/api/v1/bots/' + encodeURIComponent(bot.id) + '/logs')
        const lines = (data.logs || []).map((log) => {
          const when = new Date(log.at).toLocaleString('th-TH')
          return when + ' · ' + log.command + ' · ' + log.status + (log.message ? ' · ' + log.message : '')
        })
        detail.textContent = metrics + '\n' + (lines.length ? lines.join('\n') : 'ยังไม่มี log คำสั่ง')
      } catch (error) {
        detail.textContent = metrics + '\nโหลด log ไม่ได้: ' + error.message
      }
    }

    async function pushUpdate (ids) {
      const version = document.querySelector('#version').value.trim()
      if (!version) return showToast('ใส่เวอร์ชันก่อน')
      const file = document.querySelector('#zip').files?.[0]
      try {
        if (file) {
          const form = new FormData()
          form.append('file', file)
          form.append('version', version)
          if (ids?.length === 1) form.append('botId', ids[0])
          else if (ids?.length > 1) form.append('botId', ids[0])
          await api('/api/v1/bots/packages', { method: 'POST', body: form })
          if (ids && ids.length > 1) {
            for (const botId of ids.slice(1)) {
              await api('/api/v1/bots/update', { method: 'POST', body: JSON.stringify({ version, botId }) })
            }
          }
          showToast('เก็บ ' + file.name + ' แล้วส่งคำสั่งอัปเดต v' + version)
        } else if (!ids) {
          await api('/api/v1/bots/update', { method: 'POST', body: JSON.stringify({ version }) })
          showToast('ส่งคำสั่งอัปเดต v' + version + ' ทุกเครื่อง')
        } else {
          for (const botId of ids) {
            await api('/api/v1/bots/update', { method: 'POST', body: JSON.stringify({ version, botId }) })
          }
          showToast('ส่งคำสั่งอัปเดต v' + version)
        }
        await refresh()
      } catch (error) {
        showToast(error.message)
      }
    }

    function showApp () {
      loginForm.classList.add('hidden')
      app.classList.remove('hidden')
      document.querySelector('#barTools').classList.remove('hidden')
    }

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      document.querySelector('#loginError').textContent = ''
      try {
        const data = await api('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: document.querySelector('#email').value.trim(),
            password: document.querySelector('#password').value
          })
        })
        sessionStorage.setItem(tokenKey, data.accessToken)
        await refresh()
        showApp()
      } catch (error) {
        sessionStorage.removeItem(tokenKey)
        document.querySelector('#loginError').textContent = error.status === 403
          ? 'บัญชีนี้ไม่ใช่แอดมิน'
          : error.message
      }
    })

    document.querySelector('#logout').addEventListener('click', () => {
      sessionStorage.removeItem(tokenKey)
      location.reload()
    })
    document.querySelector('#refresh').addEventListener('click', () => refresh().catch((error) => showToast(error.message)))
    document.querySelector('#killOn').addEventListener('click', () => setKill(true))
    document.querySelector('#killOff').addEventListener('click', () => setKill(false))
    document.querySelector('#updateAll').addEventListener('click', () => pushUpdate(null))
    document.querySelector('#updateSelected').addEventListener('click', () => {
      if (!selected.size) return showToast('เลือกการ์ดก่อน')
      pushUpdate([...selected])
    })
    document.querySelector('#pickZip').addEventListener('click', () => document.querySelector('#zip').click())
    document.querySelector('#zip').addEventListener('change', (event) => {
      const file = event.target.files?.[0]
      document.querySelector('#zipNote').textContent = file
        ? 'เลือก ' + file.name + ' (' + formatSize(file.size) + ') กดอัปเดตเพื่อเก็บไฟล์โดยไม่รันบนเซิร์ฟเวอร์'
        : 'เลือกไฟล์ .zip แล้วกดอัปเดต เซิร์ฟเวอร์เก็บไฟล์ไว้โดยไม่รัน แล้วส่งคำสั่งไปเครื่อง'
    })

    setInterval(() => {
      document.querySelector('#clock').textContent = new Date().toLocaleTimeString('th-TH', { hour12: false })
    }, 1000)

    if (sessionStorage.getItem(tokenKey)) {
      refresh().then(showApp).catch(() => sessionStorage.removeItem(tokenKey))
    }
    setInterval(() => {
      if (!app.classList.contains('hidden')) refresh().catch(() => {})
    }, 10000)
