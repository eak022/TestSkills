import { Elysia } from 'elysia'

function dashboardFile (name: string) {
  return Bun.file(new URL(name, import.meta.url))
}

export const DashboardController = new Elysia({ name: 'DashboardController' })
  .get('/dashboard.css', () => dashboardFile('./dashboard.css'))
  .get('/dashboard.js', () => dashboardFile('./dashboard.js'))
  .get('/dashboard', () => dashboardFile('./dashboard.html'), {
    detail: {
      summary: 'Bot Monitor dashboard',
      description: 'หน้าแอดมินสำหรับดูสรุปบอท สั่งเปิดปิด และ kill-switch ล็อกอินด้วยบัญชี role ADMIN'
    }
  })
