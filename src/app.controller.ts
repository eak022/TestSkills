import { Elysia, NotFoundError, t } from 'elysia'
import { dayjs } from '@/libs/plugins/dayjs.plugin'
import { BadRequestError, ConflictError, UnauthorizedError } from './libs/middlewares/error-handler/domain'

const AppController = new Elysia({ name: 'AppController' })

  .get('/', () => {
    return {
      status: 'success',
      message: 'Elysia is running',
      date: dayjs().utc().toDate()
    }
  }, {
    description: 'Get the status of the application',
    response: {
      200: t.Object({
        status: t.String({ example: 'success' }),
        message: t.String({ example: 'Elysia is running' }),
        date: t.Date({ example: '2025-10-01T00:00:00Z' })
      })
    }
  })
  .get('/error', ({ query, status }) => {
    switch (query.status) {
      case 400:
        throw new BadRequestError('Bad Request!')
      case 401:
        throw new UnauthorizedError('Unauthorized!')
      case 404:
        throw new NotFoundError('Test Not Found!')
      case 409:
        throw new ConflictError('Conflict!')
      case 500:
        throw new Error('Internal Server Error!')
      default:
        return status(query.status)
    }
  }, {
    detail: {
      summary: 'Simulate error response',
      description: 'ไว้ดูรูปแบบ error { code, message } — รองรับ 400 / 401 / 404 / 409 / 500 (ค่าอื่นคืน status นั้นตรง ๆ)'
    },
    query: t.Object({
      status: t.Number({ minimum: 400, maximum: 599, example: 400, description: 'HTTP status ที่ต้องการให้ตอบกลับ' })
    })
  })

export default AppController
