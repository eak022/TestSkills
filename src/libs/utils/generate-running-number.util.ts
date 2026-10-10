import { dayjs } from '@/libs/plugins/dayjs.plugin'

export const ORDER_NO_PREFIX = 'ORD-'
export const ORDER_NO_DIGITS = 13
export const ORDER_NO_PATTERN = new RegExp(`^${ORDER_NO_PREFIX}\\d{${ORDER_NO_DIGITS}}$`)

export function isValidOrderNo (orderNo: string): boolean {
  return ORDER_NO_PATTERN.test(orderNo)
}

export function generateRunningNumber (prefix: string, currentNumber: number, digits = 7) {
  let currNum = currentNumber
  const currentNumberDigits = currNum?.toString().length

  if (currentNumberDigits > digits) {
    currNum = Number(currNum?.toString().slice(-digits))
  }

  const formattedNumber = currNum.toString().padStart(digits, '0')
  return `${prefix}${formattedNumber}`
}

export function generateRunningNumberCustomer (prefix: string, currentNumber: number, phoneNumber: string, digits = 7) {
  let currNum = currentNumber
  const currentNumberDigits = currNum?.toString().length

  if (currentNumberDigits > digits) {
    currNum = Number(currNum?.toString().slice(-digits))
  }

  const lastFourDigits = phoneNumber.slice(-4)

  const formattedNumber = currNum.toString().padStart(digits, '0')
  return `${prefix}${formattedNumber}${lastFourDigits}`
}

export function generateRunningNumberLegalAssisTance (
  prefix: string,
  currentNumber: number,
  digits = 3,
  alphaPrefix = 'A'
): string {
  const yearSuffix = dayjs().format('YY')
  const formattedNumber = currentNumber.toString().padStart(digits, '0')
  return `${prefix}${yearSuffix}${alphaPrefix}${formattedNumber}`
}

export function assemblePrefix (prefix: string, year: string, alphaPrefix: string): string {
  return `${prefix}${year}${alphaPrefix}`
}
