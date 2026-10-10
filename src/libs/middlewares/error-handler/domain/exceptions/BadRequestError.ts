import { StatusCodes } from '../../common/statusCode'

export class BadRequestError extends Error {
  public status: number

  constructor (public message: string) {
    super(message)

    this.status = StatusCodes.BAD_REQUEST
  }
}
