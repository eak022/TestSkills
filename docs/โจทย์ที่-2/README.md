# โจทย์ที่ 2 — Aniimo Webshop (UID + MyCard Points)

ต่อบนเทมเพลต Elysia เดิม Region ที่ล็อกคือ **Taiwan** สกุลเงิน **TWD** ช่องจ่าย **MyCard Points**  
เติมด้วย UID ของคนที่จะเติม ไม่ใช้รหัสผ่านผู้เล่น

วิธีเทสอยู่ใน [วิธีTest.md](วิธีTest.md) เปิด `http://localhost:3000/openapi` แท็ก **Animo** ไม่ต้องกด Authorize  
ตัวอย่างคำขออยู่ใน `http/animo.http`

ตัวละครที่ใช้คือ **Inbalckk555** UID `412000837577` เลเวล 14 เซิร์ฟเวอร์ **Aniimo-Apac** (`serverArea` 4)

## Reverse Engineering

สกุลเงินมาจาก `get_ip_currency` ของทางออกเน็ตไต้หวัน หน้า `https://www.aniimo.com/store/en/` ตอบประเทศ TW เมือง Taipei สกุลเงิน TWD  
path ภาษาและ cookie ภาษาไม่เปลี่ยนสกุลเงิน ไม่มีปุ่มสลับสกุลเงินบนหน้า `/store/tw/` ตอบ 404

ร้านไม่มีช่องค้น UID ของคนอื่น ตัวละครมาจากบัญชีที่ล็อกอินอยู่แล้ว

1. ล็อกอินอีเมลกับรหัสยืนยันที่ `POST https://worldx-office-api.aniimo.com/api/player/login` ไม่บันทึก OTP
2. ร้านดึงตัวละครของบัญชีนี้ที่ `GET https://worldx-office-api.aniimo.com/api/player/roles` ส่ง `Authorization: Bearer` ไม่มี query
3. UID บนหน้าคือ `roleId` ชื่อเซิร์ฟเวอร์คือ `serverAreaName` รหัสภายในคือ `serverArea`
4. ร้านเหรียญ `https://worldx-store-coin.kingsgroupgames.com` เรียก `POST /api/store/init` ด้วย `game_id` `999002` `game_project` `worldx_global` `source` `web` และ `server_id` ของตัวละคร สินค้าอยู่ใน `game_products` สกุลเงินอยู่ใน `get_ip_currency`
5. เลือกแพ็กแล้วร้านเรียก `POST /api/store/cal_show` ตามด้วย `POST /api/store/cal_final` เพื่อได้ราคาและรายการช่องจ่าย
6. ช่องที่ล็อกคือ **MyCard Points** จาก `cal_final`: `channel_id` `mycard` `channel` `MyCard Points` `sub_channel_id` `COSTPOINT`
7. กด Pay Now แล้วร้านเรียก `prepareOrderParams` ตามด้วย `POST /api/place_order` แล้วเด้งไปหน้ากรอกบัญชี MyCard หยุดก่อนกรอกบัญชีและก่อนจ่าย

ตอนจ่ายร้านส่ง `openid` จากเซสชันล็อกอินกับ `server_id` ซึ่งเท่ากับ `serverArea` ไม่ได้ส่ง UID ไปที่ MyCard  
API ของเราจึงตรวจ UID กับรายการ `roles` ก่อน แล้วเก็บ `serverId` ไว้ในออเดอร์ ไม่เก็บ `openid` `browser_id` หรือ `fp_device_id`

แพ็ก TWD จาก `game_products` ราคาหลังส่วนลดเดือนแรกคือราคาที่ใช้

| product_id | ชื่อ | package_id | ราคาเต็ม | ราคาที่ใช้ |
| --- | --- | --- | --- | --- |
| `com.x.aniimos.2.1.6` | 60 Lumin Crystals | 290001 | 30 | 28 |
| `com.x.aniimos.2.1.30` | 300 Lumin Crystals | 290002 | 150 | 138 |
| `com.x.aniimos.2.1.98` | 980 Lumin Crystals | 290003 | 490 | 451 |
| `com.x.aniimos.2.1.1980` | 1980 Lumin Crystals | 290004 | 990 | 911 |
| `com.x.aniimos.2.1.3280` | 3280 Lumin Crystals | 290005 | 1490 | 1371 |
| `com.x.aniimos.2.1.6480` | 6480 Lumin Crystals | 290006 | 2990 | 2751 |
| `com.x.aniimos.2.2.30` | Monthly Pass | 290008 | 150 | 150 |
| `com.x.aniimos.2.3.68` | Advanced Companion Handbook | 290009 | 320 | 320 |
| `com.x.aniimos.2.3.128` | Collector's Companion Handbook | 290010 | 690 | 690 |

แพ็ก 300 ที่เลือก MyCard Points ส่ง `cal_final` ด้วย `product_id` `com.x.aniimos.2.1.30` `act_type` `month_first_discount` `quantity` 1 `server_id` 4  
คำตอบเป็น TWD `original_price` 150 `discount_amount` 12 ราคาช่อง MyCard Points คือ 138 ค่าธรรมเนียมเพิ่ม 0

`POST /api/place_order` ของแพ็กนี้ส่งบอดี้ด้านล่าง ค่าเซสชันถูกตัดออก API ของเราไม่เรียกเส้นนี้

```json
{
  "openid": "<redacted>",
  "product_id": "com.x.aniimos.2.1.30",
  "payment_appid": "999002",
  "name": "300 Lumin Crystals",
  "return_url": "https://www.aniimo.com/store/en/",
  "price": 138,
  "channel_id": "mycard",
  "channel": "MyCard Points",
  "sub_channel_id": "COSTPOINT",
  "browser_info": { "redirect_type": "base" },
  "pay_info": { "package_id": "290002", "product_type": 1 },
  "custom_multiple": 1,
  "act_type": "month_first_discount",
  "discount": 0.92,
  "discount_price": 138,
  "fp_device_id": "<redacted>",
  "browser_id": "<redacted>",
  "server_id": 4,
  "game_id": 999002,
  "game_project": "worldx_global",
  "source": "web"
}
```

คำตอบของร้านเมื่อสำเร็จมี `code` 0 `payment_host` `https://fp-payment-worldx.kingsgroupgames.com` และ `pay_url` ไป `https://www.mycard520.com/MyCardPay/` พร้อม `AuthCode`  
ตัวอย่างคำตอบที่เก็บได้เป็นแพ็ก 60 ราคา TWD 28 คนละรายการกับบอดี้แพ็ก 300 ด้านบน `AuthCode` กับลายเซ็นออเดอร์ไม่เก็บ

## API Specifications

ฐานคือ `http://localhost:3000/api/v1/animo` เรียกได้โดยไม่ต้อง login  
ข้อผิดพลาดเป็น `{ "code", "message" }` โดย `code` คือเลขสถานะ HTTP และข้อความขึ้นต้นด้วยรหัสเคส

ค่าเริ่มต้น `ANIIMO_MODE=captured` ใช้รายการตัวละครที่เก็บจาก `GET /api/player/roles` ของบัญชีทดสอบ ไม่ยิงร้าน  
`ANIIMO_MODE=live` อ่าน `ANIIMO_BEARER` จาก `.env` แล้วเรียก `GET /api/player/roles` ห้าม commit token  
ราคาแพ็กและช่อง MyCard Points ใช้ชุดที่แกะไว้ทั้งสองโหมด ไม่เรียก `place_order`

### ตรวจตัวละคร

`POST /api/v1/animo/verify`

```json
{
  "uid": "412000837577",
  "server": "Aniimo-Apac"
}
```

`server` รับได้ทั้ง `serverAreaName` และรหัส `serverArea` เช่น `"4"`

ตอบ `200`

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

จับคู่ `uid` กับ `roleId` และ `server` กับ `serverAreaName` หรือ `serverArea` ในรายการของคนที่จะเติม

### รายการแพ็ก

`GET /api/v1/animo/packs`

ตอบ `200` โดย `country` เป็น `TW` `currency` และ `currencySymbol` เป็น `TWD` และ `packs` เป็นตารางด้านบน  
แพ็ก 300 มี `price` 138 `originalPrice` 150 `discountAmount` 12

### สรุปราคา

`POST /api/v1/animo/quote`

```json
{
  "uid": "412000837577",
  "server": "Aniimo-Apac",
  "productId": "com.x.aniimos.2.1.30"
}
```

ตอบ `200` มีตัวละครจาก verify แพ็กที่เลือก และช่องจ่าย

```json
{
  "channelId": "mycard",
  "channelName": "MyCard Points",
  "subChannelId": "COSTPOINT",
  "price": 138
}
```

`submitted` เป็น `false` เพราะยังไม่สร้างออเดอร์และยังไม่จ่าย

### สร้างออเดอร์

`POST /api/v1/animo/order` ใช้บอดี้เดียวกับ quote  
บันทึกลงตาราง `aniimoOrder` แยกจากออเดอร์ `ORD-` ของระบบเติมเกม

ตอบ `200`

- `orderNo` ขึ้นต้น `ANM-` ตามด้วยตัวเลข 13 หลัก เช่น `ANM-0000000000001`
- `status` เป็น `DRAFT`
- `submitted` เป็น `false`
- `payUrl` เป็น `null`
- `paymentHost` เป็น `https://fp-payment-worldx.kingsgroupgames.com`
- `character.serverId` เป็น `4`
- `pack.price` เป็น `138`
- `payment.channelId` เป็น `mycard` และ `payment.subChannelId` เป็น `COSTPOINT`

### เปิดออเดอร์ที่บันทึกแล้ว

`GET /api/v1/animo/orders?page=1&limit=10` เรียงจากใหม่ไปเก่า

`GET /api/v1/animo/orders/{orderNo}` ใช้เลขจากขั้นสร้างออเดอร์

## Edge Cases

หยุดเมื่อเจอ CAPTCHA หรือ rate limit ไม่หมุน IP ไม่เดา endpoint และไม่จ่ายเงิน

| เคส | ผล | การรับมือ |
| --- | --- | --- |
| UID ไม่อยู่ในรายการตัวละครของคนที่จะเติม | `400` ข้อความขึ้นต้น `UID_INVALID` | ไม่สร้างออเดอร์ |
| UID ถูกแต่เซิร์ฟเวอร์ไม่ตรง | `400` ข้อความขึ้นต้น `SERVER_MISMATCH` | แยกจากร้านล่ม ไม่ถือว่าตรวจผ่าน |
| `productId` ไม่อยู่ในแพ็ก TWD ที่แกะได้ | `400` ข้อความขึ้นต้น `PACK_NOT_FOUND` | ทั้ง quote และ order |
| เลขออเดอร์ไม่ใช่ `ANM-` ตามด้วยตัวเลข 13 หลัก | `400` | ไม่ไปค้นในตาราง `ORD-` |
| เลข `ANM-` ถูกรูปแบบแต่ไม่มีในตาราง | `404` | |
| โหมด live แล้วร้านตอบ CAPTCHA | `403` ข้อความขึ้นต้น `ANIIMO_CAPTCHA` | หยุด ให้คนตรวจเอง |
| โหมด live แล้วร้านตอบ rate limit | ข้อความขึ้นต้น `ANIIMO_RATE_LIMITED` | หยุดเรียก ไม่เปลี่ยน IP |
| โหมด live แล้วร้านล่มหรือเซสชันใช้ไม่ได้ | ข้อความขึ้นต้น `ANIIMO_UNAVAILABLE` | ไม่เดาชื่อตัวละคร |
| โหมด live แต่ไม่ได้ตั้ง `ANIIMO_BEARER` | ข้อความขึ้นต้น `ANIIMO_UNAVAILABLE` | ใส่ token ใน `.env` เท่านั้น |

โหมด `captured` ไม่เรียกร้าน จึงไม่เกิด CAPTCHA, rate limit และร้านล่ม
