# Back-End Developer Skill Test — สิ่งที่ต้องทำ

เอกสารนี้คือโจทย์รวมจากแบบทดสอบพนักงานประจำ ตำแหน่ง Back-End Developer  
โปรเจกต์ฐาน: **Elysia + Prisma + PostgreSQL + Docker Compose** (`elysai-template`)  
บอท/มอนิเตอร์อ้างอิงโฟลเดอร์ `oxide-monitor-candidate-pack/`

อย่าสร้างโปรเจกต์ใหม่จากศูนย์ ต่อจากเทมเพลตนี้ (module pattern, error handler, Prisma models)

---

## ความคืบหน้า (อัปเดตระหว่างทำ)

### ทำแล้ว

- Prisma: Order / Timeline / IdempotencyKey / PaymentAttempt / WebhookEvent / SystemAlert / BotAgent / BotCommand / AuditLog / SystemSetting
- State machine + order-ops (backoff, classify error, late webhook) + unit test
- เลขออเดอร์ `generateRunningNumber('ORD-', count, 13)`
- Order API `/api/v1/orders`: create (Idempotency-Key), get, list tabs, timeline, report-issue, claim (SKIP LOCKED), heartbeat, fulfill, fix-uid, refund, maintenance/run
- Payment webhook `/api/v1/payments/webhook` (event id + มาช้าเป็นเครดิต)
- Cron maintenance ทุกนาที: EXPIRED / reclaim lease / SLA alert / บอทเงียบ
- Bot monitor `/api/v1/bots` + kill-switch `/api/v1/system/kill-switch` เชื่อม simulator `:8788`
- README เหตุผล 5 เคส + แนวทางบอท AOEM, `http/orders.http`, `http/bots.http`, OpenAPI ลำดับเทส
- **Auth แยก 4 กลุ่ม (เพิ่มรอบนี้)**
  - ลูกค้า: JWT Bearer, `userId` มาจาก token, เห็น/แก้เฉพาะออเดอร์ตัวเอง (ของคนอื่น = 404), Idempotency-Key ผูกกับ user
  - แอดมิน: `User.role = ADMIN` (อ่านจาก DB ทุกครั้ง) → refund, maintenance, bots/*, kill-switch; ผู้สั่งใน audit log มาจาก token
  - บอท: `x-bot-key` ต่อเครื่อง (เก็บ sha256) → claim/heartbeat/fulfill/`/bots/heartbeat`, `botId` มาจากคีย์; แอดมินออก/หมุน/เพิกถอนคีย์
  - Webhook: HMAC บน raw body + timestamp ±5 นาที (production ไม่ตั้ง `WEBHOOK_SECRET` = ปฏิเสธ), event เดียวกันมาพร้อมกันไม่ประมวลซ้ำ
  - `bun run seed:admin` สร้างแอดมินคนแรก, util + unit test: api-key / webhook-signature / order-access

- **Bot worker จำลอง** `script/bot-worker.ts` (`bun run bot:worker`): heartbeat + claim + fulfill ด้วย `x-bot-key`, `BOT_FAULT` จำลอง UID ผิด/provider ล่ม/เครื่องล่ม, หยุดรับงานเมื่อ kill-switch เปิด, logic แยกไว้ใน `bot-worker.util.ts` พร้อม unit test

### ยังไม่ทำ / ค้าง

- รัน `prisma migrate` บนเครื่อง (schema เปลี่ยนรอบ auth: `User.role`, `BotAgent.apiKeyHash`, `IdempotencyKey` PK `(userId,key)`, `Order.userId` บังคับ) — ถ้ามีออเดอร์ทดสอบเก่าที่ `userId` เป็น null ให้ลบก่อนหรือ `migrate reset`
- ยังไม่เคยรันทั้งระบบกับ DB จริง (ตรวจแค่ typecheck, unit test util, และการปฏิเสธของ guard/webhook ที่ไม่ต้องใช้ DB)
- บอทจริง Midasbuy JP + Bitcash (worker มีเฉพาะโหมด simulator, โหมด real ต้อง opt-in และยังไม่ implement)
- Dashboard UI (มี API สำหรับการ์ด/summary แล้ว)
- Live demo / ส่ง GitHub
- Unit test ระดับ service ที่ยิง DB (ตอนนี้เทส logic บน util)
- ไม่ทำโดยตั้งใจ: guest ติดตามด้วย orderNo อย่างเดียว, rate limiting
- endpoint Game/Package ที่ต้อง login ยังไม่ได้ใส่ `detail.security` ใน OpenAPI (ใช้งานได้ แต่ปุ่ม Authorize อาจไม่แนบ token ให้ route พวกนั้นในบาง UI)

ขั้นถัดไป: migrate แล้วลองลำดับ OpenAPI จน claim/fulfill ได้

---

## เป้าหมายรวม (3 ส่วนที่ต้องส่งครบ)

1. **Order Tracking API** — ติดตามออเดอร์ร้านเติมเกม + state machine + แก้เคสปัญหา 5 ข้อ
2. **Centralized Bot Monitoring & Control** — ศูนย์กลาง monitor / kill-switch / อัปเดต / dispatch ออเดอร์ (อย่างน้อย 3 เครื่อง)
3. **แนวทางบอทเติม Age of Empires Mobile (Midasbuy JP + Bitcash)** — อธิบายวิธีเขียนบอท, ปัญหาที่เจอ, ระบบเช็กยอด (อ่าน simulator ที่ `oxide-monitor-candidate-pack`)

รันได้ด้วยคำสั่งเดียว (Docker Compose) หรือขั้นตอนสั้นใน README

---

## ส่วนที่ 1: Order Tracking API

ร้านรับออเดอร์จากลูกค้า แล้วให้บอทไปจ่ายเงินและเติมเกมอัตโนมัติ  
API ต้องบอกได้ว่าออเดอร์อยู่ขั้นไหน และเมื่อบอทล่ม/มีปัญหา ระบบต้องตรวจเจอและกู้เองได้

### Endpoints ที่ต้องมี

| Method | Path | หน้าที่ |
| ------ | ---- | ------- |
| POST | `/orders` | สร้างออเดอร์ รับ header `Idempotency-Key` กันสร้างซ้ำ |
| GET | `/orders/:orderNo` | ค้นด้วยเลข `ORD-` + ตัวเลข 13 หลัก เช่น `ORD-0000000000001` — format ผิด 400 / ไม่พบ 404 |
| GET | `/orders?tab=current\|history&page=` | รายการ แยกปัจจุบัน / ที่ผ่านมา แบ่งหน้า เรียงใหม่→เก่า |
| GET | `/orders/:orderNo/timeline` | ประวัติเปลี่ยนสถานะพร้อมเวลา |
| POST | `/orders/:orderNo/report-issue` | ลูกค้าแจ้งปัญหา |

เพิ่มได้ตามความเหมาะสม เช่น:

- claim / heartbeat ของบอท
- webhook ธนาคาร
- แก้ UID แล้ว retry
- ขอคืนเงิน
- kill-switch / bot status / dispatch

prefix ของเทมเพลตปัจจุบันคือ `/api` — คงสไตล์โปรเจกต์ แล้วระบุ path จริงใน README และไฟล์ทดสอบ

### State machine

**ปกติ**

`PENDING_PAYMENT` → `QUEUED` → `IN_PROGRESS` → `COMPLETED`

**มีปัญหา (หรือเพิ่มเองถ้ามีเหตุผล)**

- `DELAYED` — ล่าช้า / รอตรวจสอบ
- `FAILED` — ไม่สำเร็จ (เช่น UID ผิดแบบถาวร)
- `EXPIRED` — หมดอายุ (QR / รอจ่ายเกินเวลา)
- `REFUNDED` — คืนเงินแล้ว

`tab=current` = สถานะที่ยังไม่จบวงจร  
`tab=history` = COMPLETED / FAILED / EXPIRED / REFUNDED (และสถานะจบอื่นถ้ามี)

Prisma: `prisma/models/order.prisma` มี schema แล้ว — ต้อง migrate ก่อนใช้งาน DB

### ข้อกำหนดทั่วไปของ API

- Error response รูปแบบเดียวกันทั้งระบบ (`code`, `message`) — ใช้ error handler ของเทมเพลต
- Log ตามรอยด้วยเลขออเดอร์ได้ทุก request ที่เกี่ยวกับออเดอร์
- มี unit test (อย่างน้อย state machine, idempotency, claim/lock, expire job)

---

## ส่วนที่ 2: เคสปัญหา 5 ข้อ (น้ำหนัก 30%)

ต้องออกแบบ + implement + อธิบายเหตุผลใน README ว่าทำไมเลือกวิธีนั้น

### 1) บอทจ่ายเงินไม่ทำงาน (ล่ม / cookie หมด / timeout) ออเดอร์ค้าง

แนะนำ: heartbeat / lease  
ถ้า claim แล้วไม่อัปเดตเกิน N นาที → คืนคิว → retry exponential backoff ไม่เกิน 3 ครั้ง → ยังไม่ผ่านให้เป็น `DELAYED` และแจ้งแอดมิน

### 2) บอทสองตัวแย่งออเดอร์เดียวกัน จ่ายซ้ำ

แนะนำ: claim แบบ atomic เช่น `SELECT ... FOR UPDATE SKIP LOCKED` หรือ optimistic lock (`version`)  
มี unique constraint ของรายการจ่ายต่อออเดอร์

### 3) Webhook ธนาคารมาซ้ำ / ช้า / ผิดลำดับ

แนะนำ: idempotency / เก็บ event id ที่ประมวลผลแล้ว  
ตรวจ signature เทียบ state ก่อนเปลี่ยนสถานะ  
ถ้ามาช้าจนหมดอายุแล้ว ให้ตีเป็นเครดิตหรือคืนเงิน

### 4) เติมไม่สำเร็จ (UID ผิด / provider ล่ม)

แยก transient (retry ได้) กับ permanent (เช่น UID ผิด → `FAILED` ทันที)  
เก็บเหตุผลใน timeline  
มี endpoint แก้ UID แล้วลองใหม่ หรือขอคืนเงิน

### 5) ออเดอร์ค้าง / หมดอายุ (คิวนานเกิน SLA / QR หมดเวลา)

scheduler / cron ที่ idempotent  
`PENDING_PAYMENT` เกินเวลา → `EXPIRED`  
`QUEUED` นานเกินกำหนด → alert  
งานเบื้องหลังรันซ้ำได้โดยไม่เสียหาย

---

## ส่วนที่ 3: Centralized Bot Monitoring & Control

ศูนย์กลางควบคุมบอทอัตโนมัติ + ติดตามออเดอร์

### ต้องมี

- **API Layer** เชื่อมเครื่อง local bot: monitor สถานะ, สั่งการ, กระจายงานออเดอร์ผ่าน interface เดียว
- **Global Kill-Switch** — ปิดทั้งระบบ บอททุกเครื่องปฏิเสธรับออเดอร์/งานใหม่ทันที
- **Code Deployment / Update** — จัดการแพ็กเกจโค้ด (เช่น zip) อัปเดตพร้อมกันทุกเครื่อง หรือเลือกทีละเครื่อง
- **Overview Summary (real-time)** — Online count, Active, Standby, In Progress (อย่างน้อย 3 เครื่อง)
- **Bot instance cards** — heartbeat, bot state, งานล่าสุด Done/Failed, ปุ่มเปิด/ปิด, ดู log/metrics, อัปเดตโค้ด
- **ผูกกับ Order Tracking** — heartbeat timeout เมื่อเครื่องหลุด/ล่ม → ออเดอร์เป็น `DELAYED` หรือ `FAILED` อัตโนมัติ

### สื่อสาร

- Real-time กับบอท: WebSocket / gRPC / MQTT สำหรับ heartbeat และคำสั่ง
- REST สำหรับ Orders, Timeline, Logs

ชุดอ้างอิง (ห้ามต่อ production): `oxide-monitor-candidate-pack/`

- Simulator: `http://localhost:8788` (`GET /bots`, `POST /bots/:id/commands`)
- Schema ตัวอย่าง: `oxide-monitor-candidate-pack/db/schema.sql`
- ข้อจำกัดแพ็ก: ห้ามฝังรหัสผ่าน/token จริงในซอร์ส, ใช้บริการในชุดนี้

เทมเพลตใช้ Prisma อยู่แล้ว — แปลงตารางที่จำเป็นเป็น Prisma model ได้ อย่าทิ้ง constraint สำคัญ (claim, unique payment, processed webhook id)

Dashboard: ทำ API ให้ครบก่อน ถ้ามีเวลาค่อยทำ UI ง่าย ๆ หรือระบุใน README ว่า dashboard เรียก API ไหน

---

## ส่วนที่ 4: บอท Age of Empires Mobile (แนวทาง + ปัญหา + เช็กยอด)

หัวข้อ: บอทเติมเกม AOEM อัตโนมัติผ่าน Bitcash + เช็กยอดเงินคงเหลืออัตโนมัติ  
**อ่านโฟลเดอร์ `oxide-monitor-candidate-pack` เป็นต้นแบบบอท/มอนิเตอร์**

### ขั้นตอนทดสอบจากโจทย์ (อย่า commit รหัสผ่านลง git)

1. เปิดเฉพาะ Region Japan:  
   https://www.midasbuy.com/midasbuy/jp/shop/aoem?from=self_midasbuy_saas#!/pages/shop/items
2. Login Midasbuy ก่อนทำรายการทุกครั้ง (บัญชีทดสอบจากโจทย์ — เก็บใน `.env` ห้าม commit)

   | รายการ | ข้อมูล |
   | ------ | ------ |
   | ID | `Botfordevinblack@hotmail.com` |
   | Password | `testdev123` |

3. ข้อมูลทำรายการ  
   - UID: `5250140737488366145`  
   - Server: `Empire#239`  
   - Pack: **99+109 Coin เท่านั้น** (แพ็กอื่นเสียเงินทดสอบเยอะ)  
   - ราคา: 146 JPY
4. ช่องทางจ่าย: **Bitcash**
5. ทดสอบทำรายการจริงได้ช่วง **12:00–17:00** เพื่อขอ OTP จาก HR

### สิ่งที่โจทย์อยากเห็นจาก Dev (ต้องเขียนใน README)

- แนวทางเขียนบอท (browser automation / API reverse / hybrid, login, เลือก pack, Bitcash, OTP)
- ปัญหาที่เจอและวิธีแก้ (cookie, captcha, OTP, timeout, selector เปลี่ยน, region ผิด)
- ระบบเช็กยอดหลังทำรายการเสร็จใช้วิธีไหน (หน้าประวัติ, ยอด Bitcash, reconcile กับออเดอร์)

อย่าทำบอทยิงซื้อจริงใน CI หรือทุกครั้งที่รัน dev — แยกโหมด dry-run / simulator เป็นค่าเริ่มต้น

---

## ของที่ต้องส่ง

1. GitHub repository
2. `README.md` — ติดตั้ง/รัน, อธิบายแก้เคส 5 ข้อ, เหตุผลออกแบบ, แนวทางบอท AOEM
3. Postman collection หรือไฟล์ `.http` สำหรับทดสอบ
4. Live demo
5. ส่งกลับแชทเว็บ EXP หรืออีเมล `hr@inblackm.com`

---

## เกณฑ์คะแนน

| หัวข้อ | น้ำหนัก |
| ------ | ------- |
| ออกแบบ API และ schema, state machine | 25% |
| แก้เคสปัญหา 5 ข้อ (concurrency, idempotency, retry) | 30% |
| คุณภาพโค้ดและ test | 20% |
| README และการอธิบายเหตุผล | 15% |
| เวลา และการใช้ AI อย่างมีวิจารณญาณ | 10% |

---

## ลำดับงานที่แนะนำให้ Cursor ทำ

1. ~~ออกแบบ Prisma schema (Order + bot + webhook/payment/alert/kill-switch)~~
2. ~~Implement Order API + validation `ORD-...` + pagination tabs~~
3. ~~claim/lease, retry, expire job, webhook idempotency, classify top-up errors~~
4. ~~bot monitor API + simulator + kill-switch + summary~~ (ยังไม่มี Dashboard UI)
5. ~~unit tests util (state / orderNo / backoff / webhook outcome)~~ — ยังไม่มี integration test ยิง DB
6. ~~`.http` + README เหตุผล + แนวทางบอท AOEM~~
7. ~~Docker Compose มี Postgres + simulator~~ — ต้อง `up` + migrate บนเครื่อง
8. Live demo / push GitHub / ส่งงาน
