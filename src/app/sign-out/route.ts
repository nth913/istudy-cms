import { NextResponse } from 'next/server'

/**
 * Custom logout — visit GET /sign-out to fully clear the Payload session and
 * land back on /admin/login. Pair with the built-in user-menu logout when the
 * cookie ends up stale (e.g. role changed in DB after login).
 *
 * Cookie names come from `cookiePrefix: 'istudy'` in payload.config.ts:74.
 * We expire `istudy-token` plus the legacy `payload-token` fallback to be
 * robust against older sessions, then 302 to the login page.
 */

const COOKIES_TO_CLEAR = ['istudy-token', 'payload-token']

function buildResponse(target: URL) {
  const res = NextResponse.redirect(target, { status: 302 })
  for (const name of COOKIES_TO_CLEAR) {
    res.cookies.set({
      name,
      value: '',
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      expires: new Date(0),
      maxAge: 0,
    })
  }
  // Belt-and-braces: also send raw Set-Cookie with Max-Age=0 so non-Next
  // proxies (Nginx in prod) propagate the clear even if `cookies.set` misses.
  const headers = COOKIES_TO_CLEAR.map(
    (n) => `${n}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
  )
  for (const h of headers) res.headers.append('Set-Cookie', h)
  return res
}

export const GET = async (request: Request) => {
  const url = new URL(request.url)
  const target = new URL('/admin/login?loggedOut=1', url.origin)
  return buildResponse(target)
}

export const POST = GET
