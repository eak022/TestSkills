import { Elysia } from 'elysia'
import cors from '@elysiajs/cors'
import openapi from '@elysiajs/openapi'
import { logger } from '@tqman/nice-logger'
import { OPENAPI_TEST_GUIDE } from './libs/docs/openapi-test-guide'
import { getCorsCredentialsFlag, getOrigins } from './libs/utils/cors.util'

const AppPlugin = new Elysia({ name: 'AppPlugin' })
  .use(cors({
    origin: getOrigins(),
    ...(getCorsCredentialsFlag() ? { credentials: true } : {}),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }))
  .use(logger({
    withTimestamp: true,
    enabled: true,
    mode: 'live'
  }))
  .use(openapi({
    documentation: {
      info: {
        title: 'testSkills',
        version: '1.0.0',
        description: OPENAPI_TEST_GUIDE
      },
      tags: [
        {
          name: 'Order',
          description: 'Order Tracking — ทดสอบหลังมี Game + Server + Package แล้ว ดูลำดับเต็มที่หัวเอกสาร'
        },
        {
          name: 'Game [Private]',
          description: 'ต้องสร้างเกมพร้อม servers ก่อนแพ็กเกจและออเดอร์ (ต้องมี Bearer token)'
        },
        {
          name: 'Package [Private]',
          description: 'ต้องมี gameId จากขั้นตอนสร้างเกมก่อน (ต้องมี Bearer token)'
        },
        {
          name: 'Bot',
          description: 'Monitor / kill-switch / สั่งการบอท — เปิด simulator ที่ :8788 แล้วเรียก GET /api/v1/bots/summary'
        },
        {
          name: 'Animo',
          description: 'โจทย์ที่ 2 — ตรวจตัวละครจาก UID + server ตามที่ร้าน Aniimo ใช้หลังล็อกอิน (ไม่ต้อง Bearer)'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          botKey: {
            type: 'apiKey',
            in: 'header',
            name: 'x-bot-key',
            description: 'คีย์ต่อเครื่องบอท ออกโดยแอดมิน (POST /v1/bots)'
          }
        }
      }
    }
  }))

export default AppPlugin
