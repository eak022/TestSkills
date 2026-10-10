// import { userAuth } from '@/libs/plugins/better-auth/user-auth.plugin'
// import { prisma } from '@prisma/index'

// type UserData = {
//   name: string
//   email: string
//   password: string
// }

// function getSystemUserData (): UserData {
//   return {
//     name: process.env.SYSTEM_ADMIN_NAME || 'system_admin',
//     email: process.env.SYSTEM_ADMIN_EMAIL || 'systemadmin@email.com',
//     password: process.env.SYSTEM_ADMIN_PASSWORD || 'password123'
//   }
// }

// async function checkExistingSystemUser (email: string): Promise<boolean> {
//   const user = await prisma.user.findFirst({
//     where: {
//       email
//     }
//   })

//   return !!user
// }

// async function createSystemUser (userData: UserData) {
//   const { name, email, password } = userData
//   const payload: any = { name, email, password }

//   return userAuth.api.signUpEmail({
//     body: payload,
//     returnHeaders: true
//   })
// }

// async function assignSystemUserToAdminRole (userId: string) {
//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       role: 'admin'
//     }
//   })
//   return updatedUser
// }

// async function seed () {
//   try {
//     const systemUserData = getSystemUserData()
//     const userExists = await checkExistingSystemUser(systemUserData.email)

//     if (!userExists) {
//       const { response } = await createSystemUser(systemUserData)
//       await assignSystemUserToAdminRole(response.user.id)
//       console.log('System user created and assigned admin role successfully.')
//     } else {
//       console.log('System user already exists.')
//     }
//   } catch (error) {
//     console.error(error)
//   } finally {
//     process.exit(0)
//   }
// }

// seed()
