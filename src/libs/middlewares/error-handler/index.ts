import { type Elysia } from 'elysia'
import { ConflictError } from './domain/exceptions/ConflictError'
import { UnauthorizedError } from './domain/exceptions/UnauthorizedError'
import { type ErrorResponse } from './domain/types/generics/errorResponse'
import { StatusCodes } from './common/statusCode'
import { BadRequestError } from './domain/exceptions/BadRequestError'
import { ForbiddenError } from './domain/exceptions/ForbiddenError'

function errorResponse (handler: ErrorResponse<number>): Response {
  return new Response(JSON.stringify({
    code: handler.code,
    message: handler.message
  }), {
    status: handler.code,
    headers: { 'Content-Type': 'application/json' }
  })
}

export const ErrorHandler = (app: Elysia) => app
  .error({ ConflictError, UnauthorizedError, BadRequestError, ForbiddenError }).onError((handler): Response => {
    console.error(handler.error)
    if (
      handler.error instanceof ConflictError
      || handler.error instanceof UnauthorizedError
      || handler.error instanceof BadRequestError
      || handler.error instanceof ForbiddenError
    ) {
      handler.set.status = handler.error.status

      return errorResponse({
        message: handler.error.message,
        code: handler.error.status
      })
    }

    if (handler.code === 'NOT_FOUND') {
      handler.set.status = StatusCodes.NOT_FOUND
      let message = 'Not Found!'
      if (handler.error?.message !== 'NOT_FOUND') {
        message = handler.error.message
      }
      return errorResponse({
        message,
        code: handler.set.status
      })
    }

    if (handler.code === 'VALIDATION') {
      handler.set.status = StatusCodes.BAD_REQUEST
      let message = 'Validation Error!'
      if (handler.error?.message !== 'VALIDATION') {
        message = JSON.parse(handler.error.message)
      }
      return errorResponse({
        message,
        code: handler.set.status
      })
    }

    if (handler.code === 'PARSE') {
      handler.set.status = StatusCodes.BAD_REQUEST
      return errorResponse({
        message: 'Request body ไม่ถูกต้อง (parse ไม่ได้)',
        code: StatusCodes.BAD_REQUEST
      })
    }

    if (handler.code === 401) {
      handler.set.status = StatusCodes.UNAUTHORIZED
      return errorResponse({
        message: 'Unauthorized!',
        code: StatusCodes.UNAUTHORIZED
      })
    }

    handler.set.status = StatusCodes.INTERNAL_SERVER_ERROR

    return errorResponse({
      message: (handler?.error as Error)?.message as string || 'Server Error!',
      code: handler.set.status
    })
  })
