# testSkills — Order Tracking & Bot Monitor

Backend สำหรับติดตามออเดอร์ร้านเติมเกม และศูนย์ควบคุมบอท (skill test Back-End Developer)  
สแต็ก: **Elysia + Prisma + PostgreSQL + Docker Compose**

## รันระบบ

```bash
docker compose up -d
bun install
cp .env.example .env   # ตั้ง DATABASE_URL, USER_AUTH_SECRET, SYSTEM_USER_*, WEBHOOK_SECRET
bun run prisma:generate
bunx prisma migrate dev --schema=./prisma
# ถ้า migrate ไม่ผ่านในเครื่องนี้ ใช้: bun run prisma:db-push
bun run seed:admin     # สร้างแอดมินคนแรกจาก SYSTEM_USER_*
bun run dev
```

- API: `http://localhost:3000`
- OpenAPI: `http://localhost:3000/openapi`
- Bot simulator: `http://localhost:8788`
- ไฟล์ยิงเทส: `http/orders.http`, `http/bots.http`, `http/animo.http`
- เอกสารให้คนตรวจเดินเทสโจทย์ที่ 1: `docs/โจทย์ที่-1/README.md`
- โจทย์ที่ 2 (Aniimo UID): `docs/โจทย์ที่-2/README.md` — `POST /api/v1/animo/verify` body `{ uid, server }` ไม่ต้อง login
- โจทย์ที่ 3 (Dashboard มอนิเตอร์บอท): `http://localhost:3000/dashboard` ดู `docs/โจทย์ที่-3/README.md` และวิธีเทส `docs/โจทย์ที่-3/วิธีเทส.md`
- โจทย์ที่ 4 (บอท AOEM + Bitcash): `docs/โจทย์ที่-4/README.md` แนวทางอยู่ในหัวข้อด้านล่าง ยังไม่ยิงซื้อจริง

DB ว่างให้สร้างตามลำดับที่หัว OpenAPI: seed admin → login admin → Game (+servers) → Package → ลงทะเบียนบอท (ได้ `apiKey`) → Register/Login ลูกค้า → Order

`Idempotency-Key` ตอนสร้างออเดอร์: **client สร้างเอง** เช่น UUID `550e8400-e29b-41d4-a716-446655440000`

## การยืนยันตัวตน (แยก 4 กลุ่มผู้เรียก)

| ผู้เรียก | วิธียืนยัน | Endpoint |
|---|---|---|
| ลูกค้า | JWT Bearer — `userId` จาก token ไม่รับจาก body | create / list / get / timeline / report-issue / fix-uid (เฉพาะออเดอร์ตัวเอง ของคนอื่นได้ 404 ไม่เปิดเผยว่ามีอยู่) |
| แอดมิน | JWT + `User.role = ADMIN` (อ่านจาก DB ทุกครั้ง, ไม่ใช่ claim ใน token) → 403 ถ้าไม่ใช่ | refund, maintenance/run, `/bots/*`, kill-switch, ออก/หมุน/เพิกถอนคีย์บอท |
| บอท | `x-bot-key` ต่อเครื่อง เก็บเป็น sha256 ใน DB — `botId` มาจากคีย์ บอท A ปลอมเป็น B ไม่ได้ | claim, heartbeat, fulfill, `POST /bots/heartbeat` |
| ธนาคาร | HMAC-SHA256 บน **raw body** + `x-webhook-timestamp` (±5 นาที, ไม่บังคับ) | `POST /payments/webhook` |

เหตุผล: ระบบเติมเกมเกี่ยวกับเงิน — ถ้า userId/botId มาจาก body ใครก็แอบอ้างได้ จึงให้ตัวตนมาจากสิ่งที่ยืนยันแล้วเท่านั้น
- `WEBHOOK_SECRET` ไม่ตั้ง: dev ข้ามการตรวจ (มี warning log), **production ปฏิเสธทุกคำขอ** (fail closed)
- Idempotency-Key ผูกกับ `(userId, key)` — คนละบัญชีใช้ key เดียวกันไม่ชนกัน ส่ง key เดิม body ต่างได้ 409
- คีย์บอทแสดงครั้งเดียวตอนออก; ทุกการออก/เพิกถอน/สั่งบอท/kill-switch บันทึก `AuditLog` พร้อมชื่อแอดมิน
- เจตนาไม่ทำ: ไม่มี endpoint สมัครเป็นแอดมิน (ใช้ `bun run seed:admin`), ไม่ทำ guest tracking, ไม่ทำ rate limit

## เคสปัญหา 5 ข้อ — เหตุผลที่เลือก

1. **บอทเงียบ / timeout** — ออเดอร์มี lease + heartbeat ถ้าไม่อัปเดตเกิน 2 นาที job คืนคิวแบบ exponential backoff สูงสุด 3 ครั้ง แล้วเป็น `DELAYED` พร้อม `SystemAlert` เพราะไม่รู้ว่าจ่ายไปแล้วหรือยัง ต้องให้แอดมินดู ไม่การจ่ายซ้ำอัตโนมัติ
2. **บอทสองตัวแย่งออเดอร์** — `SELECT ... FOR UPDATE SKIP LOCKED` ใน transaction แล้วตั้ง `claimedBy` + `version` และ `PaymentAttempt.orderId` unique กันรายการจ่ายซ้ำต่อออเดอร์
3. **Webhook ธนาคารซ้ำ/ช้า** — เก็บ `WebhookEvent.eventId` ถ้าซ้ำคืนผลเดิม ไม่ประมวลซ้ำ ตรวจ HMAC จาก raw body + timestamp (production บังคับ) และถ้า event เดียวกันมาพร้อมกันตัวที่แพ้ชน PK แล้วคืนผลของตัวที่ชนะ มาช้าหลัง `EXPIRED` ตีเป็น `REFUNDED` (เครดิต) ไม่เติมเกมซ้ำ
4. **เติมไม่สำเร็จ** — `UID_INVALID` / `UID_BANNED` / `PACK_NOT_FOUND` เป็น permanent → `FAILED` ทันที ของอื่นเป็น transient แล้ว retry มี `POST .../fix-uid` และ `POST .../refund`
5. **ค้าง / หมดอายุ** — cron ทุกนาที (และ `POST /api/v1/orders/maintenance/run`) ย้าย `PENDING_PAYMENT` ที่หมด TTL เป็น `EXPIRED` แจ้ง `QUEUED` เกิน SLA แบบ idempotent (`@@unique([type, orderNo])`)

## Bot monitor

- แอดมิน: `GET /api/v1/bots/summary` — online / active / standby / in progress (simulator มี 3 เครื่อง)
- `POST /api/v1/system/kill-switch` — ปิดรับงานใหม่ทั้งฟลีต
- `POST /api/v1/bots/:id/commands` และ `POST /api/v1/bots/update` — สั่งรายเครื่องหรืออัปเดตรหัสพร้อมกัน
- `POST /api/v1/bots` ลงทะเบียนเครื่อง + ออก `apiKey`; `POST|DELETE /api/v1/bots/:id/api-key` หมุน/เพิกถอน
- บอท: `POST /api/v1/bots/heartbeat` (ใช้ `x-bot-key`) — เงียบเกินเวลาตัด offline และปล่อย lease ออเดอร์; claim จะตั้งสถานะเครื่องเป็น `in_progress`, fulfill คืนเป็น `standby`

## Bot worker (จำลอง dry-run)

บอทอยู่ที่ `oxide-monitor-candidate-pack/bot/worker.ts` เป็น client ของ API: ส่ง heartbeat → `claim` → ทำงาน (รอแทนการจ่ายจริง) → `fulfill` โดยใช้ `x-bot-key` ไม่แตะ Midasbuy/Bitcash จนกว่าจะเปิดโหมดจริง ตัวจำลองของแพ็กยังอยู่ที่พอร์ต 8788

```bash
# 1) แอดมินออกคีย์: POST /api/v1/bots → ได้ apiKey   2) รัน (หนึ่งโปรเซสต่อหนึ่งเครื่อง)
BOT_KEY=bot_xxx bun run bot:worker
BOT_KEY=bot_yyy BOT_FAULT=random bun run bot:worker   # เครื่องที่ 2 จำลองความผิดพลาด
```

| `BOT_FAULT` | เคสที่ทดสอบ |
|---|---|
| `none` (ค่าเริ่มต้น) | สำเร็จ → `COMPLETED` |
| `uid_invalid` | permanent → `FAILED` ทันที (ข้อ 4) |
| `provider_down` | transient → retry + backoff → `DELAYED` เมื่อครบ 3 ครั้ง (ข้อ 1, 4) |
| `silent` | เครื่องล่มกลางงาน ไม่ heartbeat/fulfill → lease หมด cron คืนคิว (ข้อ 1) และเครื่องถูกตัด offline |
| `random` | ผสม 70% สำเร็จ / 10% UID ผิด / 10% provider ล่ม / 10% ล่ม |

- kill-switch เปิด: worker หยุด claim เอง (เห็นจากคำตอบ heartbeat หรือ 409)
- เปิดหลายโปรเซสพร้อมกันจะเห็นการแย่งงานที่ `SKIP LOCKED` กันไว้ และการ์ด Online/In Progress ใน `/bots/summary`
- `BOT_MODE=real` ต้อง opt-in ด้วย `BOT_REAL_ENABLED=true` และอยู่ในช่วง 12:00–17:00 น. เวลาไทย จึงจะเปิดบอท Midasbuy JP + Bitcash ดูลำดับได้ก่อนด้วย `bun run bot:aoem-dry-run`

## แนวทางบอท Age of Empires Mobile (Midasbuy JP + Bitcash)

ค่าเริ่มต้นต้องเป็น **dry-run / simulator** ห้ามยิงซื้อจริงใน dev/CI

**วิธีเขียนบอท:** browser automation (Playwright) Region Japan เท่านั้น → login Midasbuy จาก env → กรอก UID/Server → เลือกแพ็ก **99+109 Coin / 146 JPY เท่านั้น** → แถว BitCash → กด Pay แล้วเลือก **Pay with MyBitCash** (ไม่ใช้ QR ของแอป และไม่ใช้ Nexgen 6) → login Bitcash จาก env → หยุดรอ OTP ที่ Outlook ของ HR (12:00–17:00) → เก็บ screenshot ใบเสร็จเป็นหลักฐานต่อออเดอร์

**ปัญหาที่เจอบ่อย**
- cookie / session หมด → login ใหม่ก่อนทุกออเดอร์
- captcha / OTP → ไม่แก้เอง ให้คิวเป็น `DELAYED` แล้วรอแอดมิน
- selector เปลี่ยน, เปิด region ผิด → fail แบบ permanent + บันทึกใน timeline
- timeout ตอนจ่าย → ใช้ lease/retry ของข้อ 1 ไม่กดจ่ายซ้ำจนกว่าจะเช็กยอดแล้ว

**เช็กยอดหลังทำรายการ:** 1) หน้าประวัติออเดอร์ Midasbuy เทียบ pack/ราคา 2) ใบเสร็จ Bitcash อ่าน Invoice No., จำนวนที่จ่าย และยอดคงเหลือก่อน-หลัง ต้องลดเท่ากับ 146 JPY 3) reconcile กับ `orderNo` ในระบบ ถ้าจ่ายสำเร็จแต่เติมไม่เข้าให้ webhook ช้า/เครดิตตามข้อ 3

บัญชีทดสอบเก็บใน `.env` ห้าม commit

## เทส

```bash
bun test src/libs/utils
```
