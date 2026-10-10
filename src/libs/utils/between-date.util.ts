import { dayjs } from '@/libs/plugins/dayjs.plugin'
import { type Prisma } from '@prisma/index'

export const betweenDate = (startDate: Date | string | undefined, endDate?: Date | string | undefined): Prisma.DateTimeFilter | undefined => {
  if (!startDate) return undefined
  const end = endDate || startDate
  return {
    gte: dayjs(startDate).startOf('day').toDate(),
    lte: dayjs(end).endOf('day').toDate()
  }
}

export const betweenDateValue = (startDate: Date | string | undefined, endDate?: Date | string | undefined) => {
  const between = betweenDate(startDate, endDate)
  const start = between?.gte || null
  const end = between?.lte || null
  return { startDate: start, endDate: end }
}
