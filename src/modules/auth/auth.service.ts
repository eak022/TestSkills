import { UnauthorizedError } from '@/libs/middlewares/error-handler/domain'

export class AuthService {
  constructor (private jwt: any) {}

  signAccessToken (payload: { id: number }) {
    return this.jwt.sign(payload)
  }

  async verifyAccessToken (token: string) {
    try {
      const payload = await this.jwt.verify(token)

      if (!payload) {
        throw new UnauthorizedError('Token expired')
      }

      return payload
    } catch (err) {
      console.warn(err)
      throw new UnauthorizedError('Invalid token')
    }
  }
}
