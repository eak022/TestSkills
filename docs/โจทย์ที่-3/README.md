# โจทย์ที่ 3 — Centralized Bot Monitoring & Order Tracking

แหล่งความจริงของงานนี้ โจทย์ที่ 1 และ 2 อยู่ที่ `docs/โจทย์ที่-1/` กับ `docs/โจทย์ที่-2/` และถือว่าเทสแล้ว  
ต่อบนเทมเพลต Elysia เดิม ห้ามสร้าง repo ใหม่

แบบทดสอบ Back End: ระบบ Centralized Bot Monitoring & Order Tracking Service  
ส่ง GitHub + README + `.http` / Postman + Live Demo ทางเว็บ EXP หรืออีเมล `hr@inblackm.com`

## วัตถุประสงค์

สร้าง API Layer และศูนย์ควบคุมบอทสำหรับร้านเติมเกมอัตโนมัติ

1. **Order Tracking API / State Machine** — รับออเดอร์ ส่งให้บอท ตรวจจับปัญหา อัปเดตสถานะ
2. **Bot Monitor Dashboard** — แผงควบคุมกลางแบบ real-time อย่างน้อย 3 เครื่อง

## สิ่งที่โจทย์กำหนดต้องมี

### ศูนย์ควบคุม

- Central Dashboard + API เชื่อมเครื่อง local bot ผ่าน interface เดียว
- Kill-switch ทั้งระบบ บอททุกเครื่องหยุดรับออเดอร์ใหม่ทันที
- จัดการแพ็กเกจโค้ดแบบไฟล์ zip อัปเดตทุกเครื่องหรือเลือกเครื่อง
- แถบสรุป real-time: Online Count, Active, Standby, In Progress
- การ์ดต่อเครื่อง: Heartbeat, สถานะบอท, งานล่าสุด Done/Failed, สั่งเปิด/ปิด, ดู Log/Metrics, อัปเดตโค้ด
- เมื่อ heartbeat ขาด ออเดอร์ที่ถืออยู่เป็น DELAYED หรือ FAILED อัตโนมัติ

### Order tracking

`PENDING_PAYMENT → QUEUED → IN_PROGRESS → COMPLETED`  
ผูกกับเคสปัญหา 5 ข้อของโจทย์ที่ 1

### สื่อสาร

- WebSocket / gRPC / MQTT สำหรับ heartbeat และคำสั่งแบบ real-time
- REST สำหรับ Orders, Timeline, Logs
- PostgreSQL เก็บ Orders, สถานะบอท, Audit, Timeline
- สแต็กที่โจทย์ยกตัวอย่างเป็น Nest/Express, Go, Spring — โปรเจกต์นี้ใช้ Elysia บนเทมเพลตเดิม ไม่ย้ายสแต็ก

## ของที่ต้องส่ง

- โค้ดบน repo นี้
- README วิธีแก้ปัญหาและวิธีรันทดสอบ
- ไฟล์ `http/*.http` หรือ Postman
- Live demo (OpenAPI ใช้แทนได้ถ้าเขียนขั้นตอนให้คนตรวจเดินตามได้)

## สิ่งที่มีจากโจทย์ที่ 1 แล้ว (อย่าทำซ้ำ)

ตรวจใน OpenAPI ตาม `docs/โจทย์ที่-1/`

| ข้อกำหนด | สถานะ | ที่อยู่ |
| --- | --- | --- |
| State machine + เคส 5 ข้อ | มีแล้ว | `POST /api/v1/orders`, webhook, claim, heartbeat, fulfill |
| Kill-switch | มีแล้ว | `GET/POST /api/v1/system/kill-switch` |
| Summary bar ข้อมูล | มีแล้วเป็น REST | `GET /api/v1/bots/summary` |
| การ์ดเครื่อง + สั่ง start/stop/restart | มีแล้วเป็น REST | `GET /api/v1/bots`, `POST /api/v1/bots/{id}/commands` |
| Heartbeat บอท | มีแล้วแบบ REST โพล | `POST /api/v1/bots/heartbeat` |
| อัปเดตเวอร์ชันโค้ด | มีแล้วแค่ส่งเลข version | `POST /api/v1/bots/update` |
| ≥ 3 เครื่อง | มีแล้ว | simulator `:8788` + worker |
| `.http` | มีแล้ว | `http/orders.http`, `http/bots.http` |

## ภาพตัวอย่างที่ต้องทำให้ใกล้เคียง

หน้ามืดชื่อ Bot Monitor แบ่งเป็น 4 ชั้น ข้อมูลมาจาก API ที่มีอยู่ หน้าเว็บเป็นของใหม่

1. หัวข้อ Bot Monitor มีสถานะออนไลน์กับเวลา และปุ่มรีเฟรช
2. แถบ Kill-switch แสดงว่าระบบเปิดหรือปิด มีปุ่มเปิดทั้งหมด / ปิดทั้งหมด
3. แถบอัปเดตโค้ด แสดงแพ็กเกจล่าสุด (ชื่อ, ขนาด, เวลา) ปุ่มเลือกไฟล์แพ็ก และปุ่มอัปโหลดทุกเครื่อง
4. แถบตัวเลข: เครื่องออนไลน์, บอทที่กำลังทำงาน, รับงาน (standby), ค้างคิว
5. การ์ดเครื่อง กดเพื่อเลือก มีชื่อเครื่อง, online/standby, host, งานล่าสุด Done/Failed และปุ่มเชื่อมต่อ, รายงานผล, อัปเดตโค้ด

อย่าก็อปชื่อ Oxide หรือชื่อเครื่องจากภาพ ใช้ข้อมูลบอทในระบบนี้ (`bot-01` ขึ้นไป)

## สถานะงานโจทย์นี้

- **หน้า Dashboard** อยู่ที่ `/dashboard` อ่าน `GET /bots/summary` ห้ามแยก repo
- **อัปเดต zip** ที่ `POST /api/v1/bots/packages` เก็บไฟล์ใน `data/bot-packages` โดยไม่รัน แล้วส่งคำสั่ง update ทั้งฟลีตหรือราย `botId` เลขเวอร์ชันอย่างเดียวยังใช้ `POST /bots/update`
- **Log / metrics** รายงานผลแสดง CPU/RAM และ `GET /api/v1/bots/{botId}/logs` คือคำสั่งล่าสุดของเครื่องนั้น
- **Live demo** ใช้หน้า dashboard กับ `docs/โจทย์ที่-3/วิธีเทส.md`
- **ช่องทาง real-time** ยังเป็น REST ตามที่ตกลง WebSocket / gRPC / MQTT ยังไม่ทำ

อย่าสร้างระบบออเดอร์ชุดที่สองทับของโจทย์ที่ 1

## กติกา

- ต่อบนเทมเพลต Elysia เดิม ห้ามสร้างโปรเจกต์ใหม่
- Error `{ code, message }` ตามเทมเพลต
- Log ตามรอยด้วย `orderNo`
- บอทโหมดจริงยังเป็น opt-in ค่าเริ่มต้น simulator / dry-run
- ห้าม hardcode รหัสผ่านลงซอร์ส
- OpenAPI ใส่ `example` ตามกติกาโปรเจกต์
- Dashboard ต้องล็อกด้วยแอดมิน (Bearer + role ADMIN) เหมือนเส้น `/bots/*`
- อัปโหลด zip ห้ามรันโค้ดจากไฟล์ที่อัปโหลดบนเซิร์ฟเวอร์กลางโดยไม่ตรวจ เก็บไฟล์แล้วส่งคำสั่ง `update` ไปเครื่องบอท
- WebSocket ใช้ยืนยันตัวตนเดียวกับแอดมิน/บอท ห้ามเปิดสาธารณะ

## ความคืบหน้า

### ทำแล้ว

- บันทึกโจทย์นี้เป็นเอกสาร
- API ออเดอร์ + มอนิเตอร์จากโจทย์ที่ 1
- หน้า `/dashboard` ล็อกอินแอดมิน ดูสรุป การ์ดเครื่อง kill-switch อัปโหลด zip และดู log คำสั่ง
- `POST /api/v1/bots/packages` เก็บ zip โดยไม่รัน แล้วส่งคำสั่ง update
- `GET /api/v1/bots/{botId}/logs`
- ขั้นตอนเทสอยู่ใน `docs/โจทย์ที่-3/วิธีเทส.md` และข้อ 15–17 ของ OpenAPI test guide

### ยังไม่ทำ

- Heartbeat / คำสั่งผ่าน WebSocket (หรือ MQTT/gRPC) — REST ใช้ส่งได้ตามที่ตกลง

## คะแนน

| หัวข้อ | น้ำหนัก |
| --- | --- |
| ออกแบบ API, schema, state machine | 25% |
| แก้เคสปัญหา 5 ข้อ | 30% |
| คุณภาพโค้ดและ test | 20% |
| README และคำอธิบายเหตุผล | 15% |
| เวลา และการใช้ AI อย่างมีวิจารณญาณ | 10% |
