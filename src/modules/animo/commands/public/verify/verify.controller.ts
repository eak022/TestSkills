import Elysia from 'elysia'
import { VerifyAnimoModel } from './verify.model'
import { VerifyAnimoService } from './verify.service'

export const VerifyAnimoHttpController = new Elysia({ name: 'VerifyAnimoHttpController' })
  .post('/verify', async ({ body }) => {
    const service = new VerifyAnimoService()
    return await service.verify(body)
  }, {
    body: VerifyAnimoModel.request,
    detail: {
      summary: 'Verify Aniimo character by UID',
      description: 'ลูกค้าเรียกได้โดยไม่ต้อง login — ส่ง uid กับ server ของคนที่จะเติม ระบบจับคู่กับรายการตัวละครแบบที่ร้านทำหลังล็อกอิน (GET /api/player/roles) ค่าเริ่มต้นใช้ข้อมูลที่แกะจากบัญชีทดสอบ ไม่ยิงร้านจนกว่าจะตั้ง ANIIMO_MODE=live'
    },
    response: {
      200: VerifyAnimoModel.response
    }
  })
