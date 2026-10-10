# วิธีเทสโจทย์ที่ 2

เปิด `http://localhost:3000/openapi` แล้วหาแท็ก **Animo**  
เส้นในชุดนี้ไม่ใช้ปุ่ม **Authorize** ค่าในช่องตัวอย่างกด Execute ได้เลย ไม่ต้องล็อกอินและไม่ต้องตั้ง `ANIIMO_MODE`

เซิร์ฟเวอร์ต้องรันอยู่แล้วแบบโจทย์ที่ 1 (`bun run dev`) โหมดเริ่มต้นคือ `captured` ใช้ตัวละครที่แกะจากร้าน ไม่ยิง Aniimo และไม่จ่ายเงิน

ตัวละครที่ใช้ทุกขั้นคือ **Inbalckk555** UID `412000837577` เซิร์ฟเวอร์ Aniimo-Apac

## 1. ตรวจตัวละคร

`POST /api/v1/animo/verify`

Body ตัวอย่าง

```json
{
  "uid": "412000837577",
  "server": "Aniimo-Apac"
}
```

คาดหวัง `200`

```json
{
  "uid": "412000837577",
  "characterName": "Inbalckk555",
  "server": "Aniimo-Apac",
  "serverId": 4,
  "level": "14",
  "country": "TH",
  "regionName": "100"
}
```

เปลี่ยน `server` เป็น `"4"` แล้ว Execute อีกครั้ง ต้องได้ตัวละครเดิม

## 2. UID ผิด

`POST /api/v1/animo/verify`

```json
{
  "uid": "000000000000",
  "server": "Aniimo-Apac"
}
```

คาดหวัง `400`

```json
{
  "code": 400,
  "message": "UID_INVALID: ไม่พบตัวละครสำหรับ UID นี้"
}
```

## 3. เซิร์ฟเวอร์ไม่ตรง

`POST /api/v1/animo/verify`

```json
{
  "uid": "412000837577",
  "server": "Aniimo-Taiwan"
}
```

คาดหวัง `400` และ `message` ขึ้นต้นด้วย `SERVER_MISMATCH`

## 4. รายการแพ็ก

`GET /api/v1/animo/packs`

คาดหวัง `200`

- `country` เป็น `TW`
- `currency` และ `currencySymbol` เป็น `TWD`
- แพ็ก `com.x.aniimos.2.1.30` ชื่อ `300 Lumin Crystals` ราคา `138` ราคาเดิม `150` ส่วนลด `12`

จด `productId` นี้ไปใช้ขั้นถัดไป ค่าตัวอย่างใน OpenAPI ใส่ไว้แล้ว

## 5. สรุปออเดอร์

`POST /api/v1/animo/quote`

```json
{
  "uid": "412000837577",
  "server": "Aniimo-Apac",
  "productId": "com.x.aniimos.2.1.30"
}
```

คาดหวัง `200`

- `character.characterName` เป็น `Inbalckk555`
- `pack.price` เป็น `138` และ `pack.discountAmount` เป็น `12`
- `payment.channelId` เป็น `mycard`
- `payment.channelName` เป็น `MyCard Points`
- `payment.subChannelId` เป็น `COSTPOINT`
- `submitted` เป็น `false`

## 6. สร้างออเดอร์ Aniimo

`POST /api/v1/animo/order` ใช้ body เดียวกับขั้น 5

คาดหวัง `200` และจด `orderNo`

- `orderNo` ขึ้นต้น `ANM-` ตามด้วยตัวเลข 13 หลัก เช่น `ANM-0000000000001`
- `status` เป็น `DRAFT`
- `submitted` เป็น `false`
- `payUrl` เป็น `null`
- `paymentHost` เป็น `https://fp-payment-worldx.kingsgroupgames.com`
- `pack.price` เป็น `138`
- `payment.channelId` เป็น `mycard`
- `payment.subChannelId` เป็น `COSTPOINT`
- `character.serverId` เป็น `4`

เส้นนี้บันทึกลงตาราง `aniimoOrder` ไม่ได้สร้างออเดอร์บนร้านและไม่ได้เปิดหน้าจ่าย MyCard เลขนี้คนละชุดกับ `ORD-`

## 7. เปิดออเดอร์ที่สร้างไว้

`GET /api/v1/animo/orders/{orderNo}` ใส่ `orderNo` จากขั้น 6

คาดหวัง `200` และได้ใบเดิม `status` เป็น `DRAFT`

`GET /api/v1/animo/orders?page=1&limit=10` ต้องเห็นใบนั้นใน `data` เรียงใหม่ไปเก่า

`GET /api/v1/animo/orders/ORD-0000000000001` ได้ `400` เพราะไม่ใช่รูปแบบ `ANM-`

`GET /api/v1/animo/orders/ANM-0000000000999` ได้ `404` ถ้ายังไม่มีเลขนี้

## 8. แพ็กที่ไม่มีในรายการ

`POST /api/v1/animo/quote`

```json
{
  "uid": "412000837577",
  "server": "Aniimo-Apac",
  "productId": "com.x.aniimos.unknown"
}
```

คาดหวัง `400` และ `message` ขึ้นต้นด้วย `PACK_NOT_FOUND`

`POST /api/v1/animo/order` ด้วย body เดียวกันได้ผลแบบเดียวกัน

CAPTCHA กับ rate limit ไม่ได้ยิงจากชุดนี้ เพราะโหมด `captured` ไม่เรียกร้าน สองเคสนั้นอยู่ในหัวข้อ Edge case ของ [README.md](README.md)
