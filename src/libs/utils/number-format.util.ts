export const numberFormat = (num: number, isMin = true) => {
  if (num == null) return null
  const min = isMin ? 2 : 0
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: min,
    maximumFractionDigits: 2
  }).format(num)
}
