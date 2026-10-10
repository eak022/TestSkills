import { findAndCountIncreaseWithTransaction } from '@/libs/utils/find-and-count-increase.util'
import { generateRunningNumber } from '@/libs/utils/generate-running-number.util'
import { prisma, UserRole } from '@prisma/index'

// สร้างแอดมินคนแรก (หรือเลื่อนบัญชีที่มีอยู่เป็น ADMIN) — ไม่มี endpoint สมัครเป็นแอดมินโดยตั้งใจ
// ตั้งค่าใน .env: SYSTEM_USER_NAME / SYSTEM_USER_EMAIL / SYSTEM_USER_PASSWORD
function getAdminInput () {
  const userName = process.env.SYSTEM_USER_NAME
  const email = process.env.SYSTEM_USER_EMAIL
  const password = process.env.SYSTEM_USER_PASSWORD

  if (!userName || !email || !password) {
    throw new Error('ต้องตั้ง SYSTEM_USER_NAME, SYSTEM_USER_EMAIL, SYSTEM_USER_PASSWORD ใน .env ก่อน')
  }
  return { userName, email, password }
}

async function seed () {
  const { userName, email, password } = getAdminInput()

  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } })
  if (existing) {
    if (existing.role === UserRole.ADMIN) {
      console.log(`แอดมิน ${email} มีอยู่แล้ว`)
      return
    }
    await prisma.user.update({ where: { id: existing.id }, data: { role: UserRole.ADMIN } })
    console.log(`เลื่อน ${email} เป็น ADMIN แล้ว (รหัสผ่านเดิมไม่เปลี่ยน)`)
    return
  }

  const hashedPassword = await Bun.password.hash(password, { algorithm: 'bcrypt' })
  await prisma.$transaction(async (tx) => {
    const countTable = await findAndCountIncreaseWithTransaction('user', tx)
    await tx.user.create({
      data: {
        userNo: generateRunningNumber('CUS-', countTable.count, 5),
        userName,
        email,
        password: hashedPassword,
        role: UserRole.ADMIN
      }
    })
  })
  console.log(`สร้างแอดมิน ${email} แล้ว`)
}

seed()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
