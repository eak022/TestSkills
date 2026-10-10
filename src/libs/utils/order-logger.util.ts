export function logOrder (orderNo: string, message: string, extra?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    orderNo,
    message,
    ...extra,
    at: new Date().toISOString()
  }))
}
