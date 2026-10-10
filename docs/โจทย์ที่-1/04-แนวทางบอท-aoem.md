# 4. แนวทางบอท Age of Empires Mobile (Midasbuy JP + Bitcash)

โจทย์ชุดนี้ถูกย้ายไปเป็นโจทย์ที่ 4 ที่ `docs/โจทย์ที่-4/README.md` ไฟล์นี้เหลือไว้เป็นบันทึกของโจทย์ที่ 1

ส่วนนี้ไม่มีขั้นตอนให้กดซื้อจริง คนตรวจอ่าน [README.md](../../README.md) หัวข้อ «แนวทางบอท Age of Empires Mobile» ได้ครบสามข้อที่โจทย์ขอ

- วิธีเขียนบอท: browser automation ที่ Region Japan, login จาก env, เลือกแพ็ก **99+109 Coin / 146 JPY** เท่านั้น, จ่าย Bitcash, รอ OTP จาก HR ช่วง 12:00–17:00
- ปัญหาที่ต้องรับมือ: cookie หมด, captcha, OTP, selector เปลี่ยน, region ผิด, timeout ตอนจ่าย
- การเช็กยอด: ประวัติออเดอร์ Midasbuy, ยอด Bitcash ก่อนกับหลัง, แล้วเทียบ `orderNo` ในระบบนี้

สิ่งที่รันได้ในชุดนี้คือตัวจำลอง ไม่ยิง Midasbuy

```bash
BOT_KEY=bot_คีย์จริง bun run bot:worker
```

มันเรียก API เดียวกับที่บอทจริงต้องเรียก คือ heartbeat, claim, fulfill ด้วย `x-bot-key`

โหมดซื้อจริงปิดไว้

```bash
BOT_MODE=real bun run bot:worker
```

ต้องตั้ง `BOT_REAL_ENABLED=true` ด้วย บอทจริงอยู่ใน `oxide-monitor-candidate-pack/bot/purchase.ts` จะกดจ่ายเฉพาะแพ็ก 146 JPY ในช่วง 12:00–17:00 น. เวลาไทย และรหัสผ่านไม่อยู่ในซอร์ส

บัญชีทดสอบตามโจทย์อยู่ใน `docs/backend-skill-test.md` ส่วนที่ 4 ห้ามก็อปไปใส่ไฟล์ที่ commit
