import type { Endpoint, Payload, PayloadRequest } from 'payload'
import crypto from 'node:crypto'
import { verifyTurnstileToken } from '../lib/turnstile'
import { sendMagicLink } from '../lib/resend'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

type SubscribeBody = {
  email?: string
  source?: string
  turnstileToken?: string
}

// Until Subscribers is registered in payload.config.ts the generated slug union
// excludes 'subscribers' — cast through an untyped Payload view to keep callsites typed.
type Subscriber = {
  id: string | number
  email: string
  status: 'pending' | 'verified' | 'unsubscribed'
  source?: string | null
  verifyToken?: string | null
  verifyTokenExpiresAt?: string | null
}
type SubscribersPayload = {
  find: (args: {
    collection: 'subscribers'
    where: Record<string, unknown>
    limit?: number
  }) => Promise<{ docs: Subscriber[] }>
  create: (args: { collection: 'subscribers'; data: Record<string, unknown> }) => Promise<Subscriber>
  update: (args: {
    collection: 'subscribers'
    id: string | number
    data: Record<string, unknown>
  }) => Promise<Subscriber>
}
const asSubscribersPayload = (p: Payload): SubscribersPayload => p as unknown as SubscribersPayload

const sha256Hex = (input: string) => crypto.createHash('sha256').update(input).digest('hex')

const getClientIp = (req: PayloadRequest): string | undefined => {
  const xff = req.headers?.get?.('x-forwarded-for')
  if (!xff) return undefined
  return xff.split(',')[0]?.trim() || undefined
}

export const newsletterSubscribeEndpoint: Endpoint = {
  path: '/v1/newsletter',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const body = ((await req.json?.()) || {}) as SubscribeBody

    const emailRaw = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!emailRaw || !EMAIL_RE.test(emailRaw)) {
      return Response.json(
        { error: 'invalid-email', message: 'Email không hợp lệ' },
        { status: 400 },
      )
    }

    const ip = getClientIp(req)
    const captchaOk = await verifyTurnstileToken(body.turnstileToken || '', ip)
    if (!captchaOk) {
      return Response.json(
        { error: 'captcha-failed', message: 'Xác thực captcha thất bại' },
        { status: 403 },
      )
    }

    const payload = asSubscribersPayload(req.payload)
    const existing = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: emailRaw } },
      limit: 1,
    })
    const current = existing.docs[0]

    if (current && current.status === 'verified') {
      return Response.json({ ok: true, alreadyVerified: true })
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = sha256Hex(rawToken)
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString()

    const source = typeof body.source === 'string' ? body.source : undefined

    if (current) {
      await payload.update({
        collection: 'subscribers',
        id: current.id,
        data: {
          status: 'pending',
          verifyToken: tokenHash,
          verifyTokenExpiresAt: expiresAt,
          ...(source && !current.source ? { source } : {}),
        },
      })
    } else {
      await payload.create({
        collection: 'subscribers',
        data: {
          email: emailRaw,
          status: 'pending',
          verifyToken: tokenHash,
          verifyTokenExpiresAt: expiresAt,
          ...(source ? { source } : {}),
        },
      })
    }

    const base = process.env.PAYLOAD_PUBLIC_SERVER_URL || ''
    const verifyUrl = `${base}/api/v1/newsletter/verify?token=${rawToken}&email=${encodeURIComponent(emailRaw)}`

    try {
      await sendMagicLink(emailRaw, verifyUrl)
    } catch (err) {
      console.error('[newsletter-subscribe] sendMagicLink failed', err)
      return Response.json(
        { error: 'email-send-failed', message: 'Không gửi được email xác nhận' },
        { status: 500 },
      )
    }

    return Response.json({ ok: true, sent: true })
  },
}
