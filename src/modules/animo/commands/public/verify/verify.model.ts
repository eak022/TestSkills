import { t } from 'elysia'

export namespace VerifyAnimoModel {
  export const request = t.Object({
    uid: t.String({
      minLength: 1,
      example: '412000837577',
      description: 'UID ที่หัวร้านโชว์หลังล็อกอิน = roleId จาก GET /api/player/roles ไม่ใช่รหัสผ่าน'
    }),
    server: t.String({
      minLength: 1,
      example: 'Aniimo-Apac',
      description: 'ชื่อเซิร์ฟเวอร์บนร้าน (serverAreaName) หรือรหัส serverArea เช่น 4'
    })
  })
  export type request = typeof request.static

  export const response = t.Object({
    uid: t.String({ example: '412000837577', description: 'roleId ที่ร้านยืนยัน' }),
    characterName: t.String({ example: 'Inbalckk555' }),
    server: t.String({ example: 'Aniimo-Apac', description: 'serverAreaName' }),
    serverId: t.Number({ example: 4, description: 'serverArea ที่ร้านส่งต่อเป็น server_id ตอน checkout' }),
    level: t.String({ example: '14' }),
    country: t.String({ example: 'TH' }),
    regionName: t.String({ example: '100' })
  })
  export type response = typeof response.static
}
