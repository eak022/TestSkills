import dayjs from 'dayjs'

export const generateUniqueLinkNo = (): string => {
  const time = dayjs().format('YYYYMMDDHHmmssSSS')
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')

  return `${random}${time}`
}
