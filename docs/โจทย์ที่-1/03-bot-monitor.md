# 3. ศูนย์ควบคุมบอท

ใช้ token **แอดมิน** ยกเว้น heartbeat ของเครื่อง ซึ่งใช้ `x-bot-key`

Simulator ต้องรันอยู่ที่พอร์ต 8788 (`docker compose up -d`) ไม่งั้น summary ยังมีเฉพาะเครื่องที่ลงทะเบียนเอง

## 3.1 สรุปและรายการเครื่อง

`GET /api/v1/bots/summary`

คาดหวังอย่างน้อย

- `onlineCount`, `active`, `standby`, `inProgress`
- `bots` มีเครื่องจาก simulator (`bot-01`, `bot-02`, `bot-03`) รวมเครื่องที่รัน worker อยู่
- เครื่องที่ worker ยังส่ง heartbeat อยู่เป็น `online`
- ระหว่าง worker กำลังทำออเดอร์ `workState` ของเครื่องนั้นเป็น `in_progress` ทำเสร็จแล้วกลับเป็น `standby`

`GET /api/v1/bots` ได้การ์ดรายเครื่อง รวม `lastJobResult` เป็น `Done` หรือ `Failed` ตามรอบล่าสุด

ลูกค้าเรียกสองเส้นนี้ได้ `403` ไม่ใส่ token ได้ `401`

## 3.2 คีย์ต่อเครื่อง

`POST /api/v1/bots/{botId}/api-key` ได้ `apiKey` ใหม่ คีย์เก่าใช้ทันทีไม่ได้

เอาคีย์เก่าไปรัน `BOT_KEY=คีย์เก่า bun run bot:worker` ต้องหยุดด้วยข้อความ `bot key ไม่ถูกต้องหรือถูกเพิกถอน`

`DELETE /api/v1/bots/{botId}/api-key` แล้วคีย์ล่าสุดใช้ไม่ได้เช่นกัน ต้องออกใหม่ก่อนรัน worker

## 3.3 Kill-switch

`POST /api/v1/system/kill-switch`

```json
{ "enabled": true }
```

worker ที่รันอยู่จะพิมพ์ `kill_switch_on_stop_claiming` หรือ `claim_refused_kill_switch` ภายในไม่เกิน 30 วินาที และไม่รับออเดอร์ใหม่

สร้างออเดอร์แล้วยิง `PAID` สถานะค้างที่ `QUEUED` ไม่มี `Claimed by` เพิ่ม

`GET /api/v1/system/kill-switch` ได้ `{ "enabled": true }`

ปิดกลับ

```json
{ "enabled": false }
```

worker รับงานค้างต่อได้เอง

`POST /api/v1/orders/claim` ตอน kill-switch เปิด และใส่ `x-bot-key` ที่ยังใช้ได้ ต้องได้ `409`

## 3.4 สั่งการและอัปเดตโค้ด

`POST /api/v1/bots/bot-01/commands`

```json
{ "command": "restart" }
```

ได้ `status: success` เมื่อ simulator ตอบได้ คำสั่งที่ส่งได้คือ `start`, `stop`, `restart`, `status`, `update` ไม่มีช่อง `requestedBy` ชื่อคนสั่งมาจาก token แอดมิน

ตอน kill-switch เปิด `start` และ `restart` ได้ `409`

`POST /api/v1/bots/update`

```json
{ "version": "1.0.1" }
```

ไม่ส่ง `botId` คือทุกเครื่อง ส่ง `botId` คือเครื่องเดียว จากนั้น `GET /api/v1/bots` ต้องเห็น `codeVersion` เป็น `1.0.1`

แนวทางบอทซื้อของจริงอยู่ที่ [04-แนวทางบอท-aoem.md](04-แนวทางบอท-aoem.md)
