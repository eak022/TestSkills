export function getOrigins () {
  const originStrings = process.env.CORS_ORIGIN || Bun.env.CORS_ORIGIN || '*'
  let origins = originStrings.split(',').map((origin) => origin.trim())
  const allowAllOrigins = origins.includes('*') || origins.length === 0
  if (allowAllOrigins) {
    origins = ['*']
  }
  return origins
}

export function getCorsCredentialsFlag () {
  const originStrings = process.env.CORS_ORIGIN || Bun.env.CORS_ORIGIN || '*'
  const origins = originStrings.split(',').map((origin) => origin.trim())
  return origins.includes('*') || origins.length === 0
}
