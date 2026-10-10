import { StatusCodes } from '../../common/statusCode'

export class UnauthorizedError extends Error {
  public status: number

  constructor (public message: string) {
    super(message)

    this.status = StatusCodes.UNAUTHORIZED
  }
}
