import type { Endpoint, Payload, PayloadRequest } from 'payload'
import crypto from 'node:crypto'
import { addContactToAudience } from '../lib/resend'

const sha256Hex = (input: string) => crypto.createHash('sha256').update(input).digest('hex')

// Until Subscribers is registered in payload.config.ts the generated slug union
// excludes 'subscribers' — cast through an untyped Payload view to keep callsites typed.
type Subscriber = {
  id: string | number
  email: string
  status: 'pending' | 'verified' | 'unsubscribed'
  verifyToken?: string | null
  verifyTokenExpiresAt?: string | null
}
type SubscribersPayload = {
  find: (args: {
    collection: 'subscribers'
    where: Record<string, unknown>
    limit?: number
  }) => Promise<{ docs: Subscriber[] }>
  update: (args: {
    collection: 'subscribers'
    id: string | number
    data: Record<string, unknown>
  }) => Promise<Subscriber>
}
const asSubscribersPayload = (p: Payload): SubscribersPayload => p as unknown as SubscribersPayload

export const newsletterVerifyEndpoint: Endpoint = {
  path: '/v1/newsletter/verify',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const feBase = process.env.FE_URL || 'http://localhost:3000'
    const url = new URL(req.url || '', 'http://localhost')
    const token = url.searchParams.get('token') || ''
    const emailRaw = url.searchParams.get('email') || ''

    if (!token || !emailRaw) {
      return Response.redirect(`${feBase}/?subscribed=invalid`, 302)
    }

    const email = emailRaw.toLowerCase().trim()
    const tokenHash = sha256Hex(token)

    const payload = asSubscribersPayload(req.payload)
    const found = await payload.find({
      collection: 'subscribers',
      where: {
        and: [{ email: { equals: email } }, { verifyToken: { equals: tokenHash } }],
      },
      limit: 1,
    })
    const sub = found.docs[0]
    if (!sub) {
      return Response.redirect(`${feBase}/?subscribed=invalid`, 302)
    }

    const expiresAt = sub.verifyTokenExpiresAt ? new Date(sub.verifyTokenExpiresAt) : null
    if (!expiresAt || expiresAt.getTime() < Date.now()) {
      return Response.redirect(`${feBase}/?subscribed=expired`, 302)
    }

    const resendContactId = await addContactToAudience(email)

    await payload.update({
      collection: 'subscribers',
      id: sub.id,
      data: {
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        verifyToken: null,
        verifyTokenExpiresAt: null,
        ...(resendContactId ? { resendContactId } : {}),
      },
    })

    return Response.redirect(`${feBase}/?subscribed=1`, 302)
  },
}
