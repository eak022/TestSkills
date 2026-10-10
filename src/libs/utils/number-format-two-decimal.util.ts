export const formatTwoDecimal = (number: string | number) => {
  const num = parseFloat(number.toString())
  const result = parseFloat(num.toFixed(2))
  return result
}
