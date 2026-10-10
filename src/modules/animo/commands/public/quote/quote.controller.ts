import Elysia from 'elysia'
import { QuoteAnimoModel } from './quote.model'
import { QuoteAnimoService } from './quote.service'

export const QuoteAnimoHttpController = new Elysia({ name: 'QuoteAnimoHttpController' })
  .get('/packs', () => {
    return new QuoteAnimoService().listPacks()
  }, {
    detail: {
      summary: 'List captured Aniimo TWD packs',
      description: 'ลูกค้าเรียกได้โดยไม่ต้อง login — รายการแพ็กจาก game_products ของร้านตอนทางออกเน็ตไต้หวัน สกุลเงิน TWD ไม่ยิงร้านและไม่จ่ายเงิน'
    },
    response: {
      200: QuoteAnimoModel.packsResponse
    }
  })
  .post('/quote', async ({ body }) => {
    return await new QuoteAnimoService().quote(body)
  }, {
    body: QuoteAnimoModel.request,
    detail: {
      summary: 'Quote Aniimo pack with MyCard Points',
      description: 'ลูกค้าเรียกได้โดยไม่ต้อง login — ตรวจ uid กับ server แบบ POST /api/v1/animo/verify แล้วสรุปแพ็ก TWD กับช่อง MyCard Points (channel_id mycard, sub_channel_id COSTPOINT) จาก cal_final ค่า submitted เป็น false เพราะยังไม่เรียก place_order'
    },
    response: {
      200: QuoteAnimoModel.response
    }
  })
