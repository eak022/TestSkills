import { parseSetCookieHeader } from 'better-auth/cookies'

export function extractTokenFromHeaders (headers: Headers) {
  const header = headers.get('set-cookie')
  const cookies = parseSetCookieHeader(header || '')
  const signedCookie = cookies.get('better-auth.session_token')?.value

  return new Headers({
    cookie: `better-auth.session_token=${signedCookie}`
  })
}

export function extractTokenFromCookies (header: Headers) {
  const cookie = header.get('cookie')
  const cookies = parseSetCookieHeader(cookie || '')
  const signedCookie = cookies.get('better-auth.session_token')?.value

  return new Headers({
    cookie: `better-auth.session_token=${signedCookie}`
  })
}
