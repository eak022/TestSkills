# 1. Order Tracking — เส้นทางปกติจนเติมสำเร็จ

ใช้ token **ลูกค้า** ยกเว้นจุดที่ระบุว่าเป็นแอดมินหรือบอท

ก่อนเริ่ม หยุด worker ทุกตัว แล้วเปิดใหม่แบบสำเร็จ

```bash
BOT_KEY=bot_คีย์ของbot-04 bun run bot:worker
```

log ต้องมี `"fault":"none"` และไม่มีบรรทัด `bot key ไม่ถูกต้อง`

## 1.1 สร้างออเดอร์

`POST /api/v1/orders`

Header `Idempotency-Key` สร้างเอง เช่น `order-create-001`

```json
{
  "playerUid": "5250140737488366145",
  "packageId": 1,
  "serverId": 1
}
```

ไม่มี `userId` ใน body ระบบเอาจาก token

คาดหวัง `201` หรือ `200` ตามที่ OpenAPI แสดง และ

- `orderNo` รูปแบบ `ORD-` ตามด้วยตัวเลข 13 หลัก จดเลขนี้
- `status` เป็น `PENDING_PAYMENT`

ยิงซ้ำด้วย header เดิมและ body เดิม ต้องได้ `orderNo` เดิม

ยิงด้วย header เดิมแต่เปลี่ยน `playerUid` ต้องได้ `409`

ไม่ใส่ token ต้องได้ `401`

## 1.2 ดูรายการและกันคนอื่น

`GET /api/v1/orders?tab=current&page=1&limit=10` ต้องเห็นออเดอร์นี้

`GET /api/v1/orders/{orderNo}` เจ้าของเห็นรายละเอียด

`GET /api/v1/orders/{orderNo}/timeline` บรรทัดแรกคือ `null → PENDING_PAYMENT` เหตุผล `Order created`

`GET /api/v1/orders/ORD-123` ได้ `400` เพราะรูปแบบเลขผิด

ถ้า login เป็นลูกค้าอีกคนแล้วเปิด orderNo นี้ ต้องได้ `404` แอดมินเปิดอันเดียวกันได้

## 1.3 จำลองว่าลูกค้าจ่ายแล้ว

สลับ Authorize ออกจาก Bearer ได้ webhook ไม่ใช้ JWT

`POST /api/v1/payments/webhook`

Header `x-event-id: evt_001`

```json
{
  "orderNo": "ORD-เลขที่จดไว้",
  "status": "PAID",
  "providerRef": "bitcash-txn-001"
}
```

คาดหวัง

```json
{ "outcome": "queued", "replayed": false }
```

ภายในประมาณ 5 วินาที worker พิมพ์ `order_claimed` แล้วอีก 3–8 วินาทีพิมพ์ `order_fulfill_reported`

## 1.4 ตรวจผล

`GET /api/v1/orders/{orderNo}/timeline` ต้องเรียงแบบนี้

1. `null → PENDING_PAYMENT` — `Order created`
2. `PENDING_PAYMENT → QUEUED` — `Bank webhook PAID (evt_001)`
3. `QUEUED → IN_PROGRESS` — `Claimed by bot-04`
4. `IN_PROGRESS → COMPLETED` — `Top-up success by bot-04`

`GET /api/v1/orders?tab=history&page=1&limit=10` ต้องเห็นออเดอร์นี้ เพราะ `COMPLETED` อยู่แท็บประวัติ

ยิง webhook เดิมอีกครั้งด้วย `x-event-id: evt_001` ต้องได้ `replayed: true` และ timeline ไม่เพิ่มแถว

เส้นนี้ผ่านแล้วไป [02-เคสปัญหา-5-ข้อ.md](02-เคสปัญหา-5-ข้อ.md) ทุกเคสหลังจากนี้ต้องสร้างออเดอร์ใหม่และเลื่อนเลข `x-event-id` กับ `providerRef`
