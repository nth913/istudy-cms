import type { Endpoint, PayloadRequest } from 'payload'
import { ensureAnonId } from '../lib/anon-cookie'
import { verifyTurnstileToken } from '../lib/turnstile'

const VALID_TYPES = ['exam', 'dap-an', 'feature', 'event'] as const
type NotifyType = (typeof VALID_TYPES)[number]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type NotifyBody = {
  email?: string
  refSlug?: string
  turnstileToken?: string
}

const errorJson = (status: number, error: string, message: string) =>
  Response.json({ error, message }, { status })

export const notifyEndpoint: Endpoint = {
  path: '/v1/notify/:type',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const type = (req.routeParams as { type?: string } | undefined)?.type
    if (!type || !VALID_TYPES.includes(type as NotifyType)) {
      return errorJson(400, 'invalid-type', 'Loại notify không hợp lệ')
    }
    const notifyType = type as NotifyType

    const body = ((await req.json?.()) ?? {}) as NotifyBody
    const refSlug = typeof body.refSlug === 'string' ? body.refSlug.trim() : ''
    const email =
      typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    const turnstileToken =
      typeof body.turnstileToken === 'string' ? body.turnstileToken : ''

    if (!email || !refSlug) {
      return errorJson(400, 'missing-fields', 'Thiếu email hoặc refSlug')
    }
    if (!EMAIL_REGEX.test(email)) {
      return errorJson(400, 'invalid-email', 'Email không hợp lệ')
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined

    const captchaOk = await verifyTurnstileToken(turnstileToken, ip)
    if (!captchaOk) {
      return errorJson(403, 'captcha-failed', 'Xác minh CAPTCHA thất bại')
    }

    if (notifyType === 'exam' || notifyType === 'dap-an') {
      const found = await req.payload.find({
        collection: 'exams',
        where: { slug: { equals: refSlug } },
        limit: 1,
        depth: 0,
      })
      if (!found.docs.length) {
        return errorJson(404, 'ref-not-found', 'Không tìm thấy đề/sự kiện này')
      }
    } else if (notifyType === 'event') {
      try {
        const found = await req.payload.find({
          collection: 'events' as any,
          where: { slug: { equals: refSlug } },
          limit: 1,
          depth: 0,
        })
        if (!found.docs.length) {
          return errorJson(404, 'ref-not-found', 'Không tìm thấy đề/sự kiện này')
        }
      } catch {
        return errorJson(404, 'ref-not-found', 'Không tìm thấy đề/sự kiện này')
      }
    }

    const secret = process.env.ANON_COOKIE_SECRET
    if (!secret) {
      return errorJson(500, 'server-config', 'ANON_COOKIE_SECRET chưa cấu hình')
    }
    const { anonId, signed, fresh } = ensureAnonId(req.headers.get('cookie'), secret)

    const existing = await req.payload.find({
      collection: 'notify_intents' as any,
      where: {
        and: [
          { type: { equals: notifyType } },
          { refSlug: { equals: refSlug } },
          { email: { equals: email } },
        ],
      },
      limit: 1,
      depth: 0,
    })

    let alreadyExists = false
    if (existing.docs.length > 0) {
      alreadyExists = true
    } else {
      await req.payload.create({
        collection: 'notify_intents' as any,
        data: {
          type: notifyType,
          refSlug,
          email,
          anonId,
          ua: req.headers.get('user-agent') || undefined,
          referer: req.headers.get('referer') || undefined,
          ip,
          fulfilled: false,
        } as any,
      })
    }

    const res = Response.json({ ok: true, alreadyExists })
    if (fresh) {
      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : ''
      const cookie = `anon_id=${encodeURIComponent(signed)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 365}${secureFlag}`
      res.headers.append('Set-Cookie', cookie)
    }
    return res
  },
}
