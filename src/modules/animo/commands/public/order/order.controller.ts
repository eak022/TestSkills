import Elysia from 'elysia'
import { AniimoOrderRepository } from '@/repositories/aniimo-order.repository'
import { CreateAniimoOrderService } from './create-order.service'
import { FindAniimoOrderService } from './find-order.service'
import { FindAniimoOrdersService } from './find-orders.service'
import { OrderAnimoModel } from './order.model'

export const OrderAnimoHttpController = new Elysia({ name: 'OrderAnimoHttpController' })
  .post('/order', async ({ body }) => {
    const service = new CreateAniimoOrderService(new AniimoOrderRepository())
    return await service.execute(body)
  }, {
    body: OrderAnimoModel.request,
    detail: {
      summary: 'Create an Aniimo order without paying',
      description: 'ลูกค้าเรียกได้โดยไม่ต้อง login — ตรวจ uid กับ server แล้วบันทึกออเดอร์ Aniimo สถานะ DRAFT ช่อง MyCard Points ลงตาราง aniimoOrder ไม่ยิงร้าน payUrl เป็น null และได้ orderNo ขึ้นต้น ANM-'
    },
    response: {
      200: OrderAnimoModel.response
    }
  })
  .get('/orders', async ({ query }) => {
    const service = new FindAniimoOrdersService(new AniimoOrderRepository())
    return await service.execute(query)
  }, {
    query: OrderAnimoModel.listQuery,
    detail: {
      summary: 'List Aniimo orders',
      description: 'ลูกค้าเรียกได้โดยไม่ต้อง login — รายการออเดอร์ Aniimo ที่บันทึกไว้ เรียงจากใหม่ไปเก่า ไม่รวมออเดอร์ ORD- ของระบบเติมเกม'
    },
    response: {
      200: OrderAnimoModel.listResponse
    }
  })
  .get('/orders/:orderNo', async ({ params }) => {
    const service = new FindAniimoOrderService(new AniimoOrderRepository())
    return await service.execute(params.orderNo)
  }, {
    params: OrderAnimoModel.params,
    detail: {
      summary: 'Find one Aniimo order',
      description: 'ลูกค้าเรียกได้โดยไม่ต้อง login — ใช้ orderNo จาก POST /api/v1/animo/order รูปแบบ ANM- ตามด้วยตัวเลข 13 หลัก รูปแบบผิดได้ 400 ไม่พบได้ 404'
    },
    response: {
      200: OrderAnimoModel.response
    }
  })
