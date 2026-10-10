export const OPENAPI_TEST_GUIDE = `
ระบบแยกผู้เรียกเป็น 4 กลุ่ม — แต่ละกลุ่มยืนยันตัวตนคนละแบบ (ดู **Authorize** มุมขวาบน)

| ผู้เรียก | วิธียืนยัน | ใช้กับ |
|---|---|---|
| ลูกค้า | \`Authorization: Bearer {accessToken}\` | สร้าง/ดู/แก้ออเดอร์ **ของตัวเอง** (userId มาจาก token) |
| แอดมิน | Bearer + \`role = ADMIN\` | refund, maintenance, bots/*, kill-switch |
| บอท | \`x-bot-key\` (คีย์ต่อเครื่อง) | claim, heartbeat, fulfill, \`/bots/heartbeat\` |
| ธนาคาร | HMAC \`x-webhook-signature\` (+ \`x-webhook-timestamp\`) | \`/payments/webhook\` |

## ลำดับทดสอบจากศูนย์ (DB ว่าง)

1. **สร้างแอดมิน** ในเทอร์มินัล: ตั้ง \`SYSTEM_USER_*\` ใน \`.env\` แล้ว \`bun run seed:admin\` (ไม่มี endpoint สมัครแอดมิน โดยตั้งใจ)
2. **Login แอดมิน** \`POST /api/v1/auth/login\` → กด **Authorize** (bearerAuth) ใส่ token แอดมิน
3. **สร้างข้อมูลต้นทาง**: \`POST /api/v1/game\` (พร้อม \`servers\` เช่น \`Empire#239\`) → \`GET /api/v1/game?page=1\` เก็บ \`gameId\` → \`GET /api/v1/game/{id}\` เก็บ \`servers[].id\` เป็น \`serverId\` → \`POST /api/v1/package\` (99+109 Coin) → \`GET /api/v1/package?page=1\` เก็บ \`packageId\`
4. **ลงทะเบียนบอท** (แอดมิน) \`POST /api/v1/bots\` เช่น \`bot-01\` → ได้ \`apiKey\` **แสดงครั้งเดียว** (หายต้องหมุนใหม่ด้วย \`POST /bots/{botId}/api-key\`) → ใส่ใน Authorize ช่อง **botKey**
5. **สมัคร/ล็อกอินลูกค้า** \`POST /api/v1/auth/register\` → เปลี่ยน token ใน Authorize เป็นของลูกค้า (แอดมินเห็นทุกออเดอร์ ถ้าอยากเทสมุมลูกค้าล้วนให้ใช้บัญชีลูกค้า)
6. **Create Order** \`POST /api/v1/orders\`
   - Header \`Idempotency-Key\`: **client สร้างเอง** (แนะนำ UUID) key ผูกกับผู้ใช้ — คนละบัญชีใช้ key ซ้ำกันได้
   - Body: \`playerUid\`, \`packageId\`, \`serverId\` (ไม่มี \`userId\` — มาจาก token)
   - เก็บ \`orderNo\` เช่น \`ORD-0000000000001\`
7. ดูออเดอร์: \`GET /orders/{orderNo}\` → \`?tab=current\` → timeline — บัญชีอื่นที่ไม่ใช่เจ้าของจะได้ 404
8. Replay create ด้วย **key เดิม + body เดิม** ต้องได้ order เดิม; key เดิม body ต่าง → 409
9. **จำลองจ่ายเงิน** \`POST /api/v1/payments/webhook\` header \`x-event-id\` (สร้างเอง) body \`status=PAID\` → ออเดอร์เป็น QUEUED
   - dev ไม่ตั้ง \`WEBHOOK_SECRET\` = ข้ามการตรวจ signature; ตั้งแล้วต้องส่ง \`x-webhook-signature\` = HMAC-SHA256 hex ของ raw body (หรือ \`\${timestamp}.\${rawBody}\` ถ้าส่ง \`x-webhook-timestamp\`)
   - production ไม่ตั้ง secret = ปฏิเสธทุกคำขอ
10. **บอทรับงาน** (ใช้ botKey) \`POST /api/v1/orders/claim\` → IN_PROGRESS แล้ว \`/{orderNo}/heartbeat\` → \`/{orderNo}/fulfill\` (ไม่ต้องส่ง botId — ระบบรู้จากคีย์)
11. **ลูกค้า**: \`report-issue\` / \`fix-uid\` กับออเดอร์ตัวเอง; **แอดมิน**: \`refund\`
12. **ไม่อยากกด claim เอง**: รัน \`BOT_KEY=<apiKey> bun run bot:worker\` (simulator) worker จะ claim/heartbeat/fulfill ให้อัตโนมัติ ใส่ \`BOT_FAULT=silent|uid_invalid|provider_down|random\` เพื่อจำลองเคสปัญหา
13. **มอนิเตอร์** (แอดมิน): \`GET /api/v1/bots/summary\` (รัน simulator :8788) และ \`POST /api/v1/system/kill-switch\`; บอทยิง \`POST /api/v1/bots/heartbeat\` ด้วย botKey
14. **โจทย์ที่ 2 ตรวจ UID Aniimo** \`POST /api/v1/animo/verify\` body \`uid=412000837577\` \`server=Aniimo-Apac\` ไม่ต้อง Authorize — UID ผิดได้ 400 \`UID_INVALID\`, เซิร์ฟเวอร์ผิดได้ 400 \`SERVER_MISMATCH\` จากนั้น \`GET /api/v1/animo/packs\` แล้ว \`POST /api/v1/animo/quote\` ด้วย \`productId=com.x.aniimos.2.1.30\` ได้ราคา TWD 138 ช่อง MyCard Points และ \`submitted: false\` จากนั้น \`POST /api/v1/animo/order\` บันทึกออเดอร์ Aniimo สถานะ \`DRAFT\` ได้ \`orderNo\` ขึ้นต้น \`ANM-\` และ \`payUrl\` เป็น null เปิดใบนั้นด้วย \`GET /api/v1/animo/orders/{orderNo}\` หรือรายการที่ \`GET /api/v1/animo/orders?page=1&limit=10\` แพ็กที่ไม่มีในรายการได้ 400 \`PACK_NOT_FOUND\` เลขไม่ใช่รูปแบบ \`ANM-\` ได้ 400
15. **โจทย์ที่ 3 แดชบอร์ด** เปิด \`/dashboard\` ล็อกอินบัญชี ADMIN ดูสรุปและการ์ด ปุ่มเปิดทั้งหมด = \`kill-switch\` \`enabled: false\` (พื้นเขียว) ปุ่มปิดทั้งหมด = \`enabled: true\` (พื้นแดง)
16. **แพ็กเกจ zip** \`POST /api/v1/bots/packages\` แบบ multipart ฟิลด์ \`file\` (.zip) กับ \`version\` เช่น \`1.0.1\` ไม่ส่ง \`botId\` = ทุกเครื่อง ส่ง \`botId\` จาก \`GET /bots\` = เครื่องนั้น เซิร์ฟเวอร์เก็บไฟล์อย่างเดียว ไม่รัน ดูของล่าสุดที่ \`GET /bots/packages/latest\`
17. **log เครื่อง** \`GET /api/v1/bots/bot-01/logs\` หรือกดรายงานผลบนการ์ด

ข้อผิดพลาดรูปแบบ \`{ code, message }\`: 401 ไม่มี/คีย์-token ผิด, 403 ไม่ใช่แอดมิน, 404 ไม่พบ/ไม่ใช่เจ้าของ

OpenAPI UI: \`/openapi\`
`.trim()
