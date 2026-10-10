import { StatusCodes } from '../../common/statusCode'

export class ConflictError extends Error {
  public status: number

  constructor (public message: string) {
    super(message)

    this.status = StatusCodes.CONFLICT
  }
}
