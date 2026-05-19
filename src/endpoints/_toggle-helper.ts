import { ensureAnonId } from '../lib/anon-cookie'

const COOKIE_OPTS = `HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 365}`

export async function handleToggle(
  req: any,
  refType: 'post' | 'exam',
  kind: 'like' | 'bookmark',
): Promise<Response> {
  const id = (req.routeParams as any)?.id
  if (!id) {
    return Response.json({ error: 'missing-id', message: 'Thiếu ID' }, { status: 400 })
  }

  const secret = process.env.ANON_COOKIE_SECRET
  if (!secret) {
    return Response.json(
      { error: 'server-config', message: 'ANON_COOKIE_SECRET chưa cấu hình' },
      { status: 500 },
    )
  }

  const cookieHeader = req.headers.get('cookie')
  const { anonId, signed, fresh } = ensureAnonId(cookieHeader, secret)

  const collection = refType === 'post' ? 'posts' : 'exams'
  const target = await req.payload
    .findByID({ collection, id, depth: 0 })
    .catch(() => null)
  if (!target) {
    return Response.json(
      { error: 'not-found', message: 'Không tìm thấy nội dung' },
      { status: 404 },
    )
  }

  // For drafts mode collections, _status field. Skip _status check if collection has no drafts.
  if (target._status !== undefined && target._status !== 'published') {
    return Response.json(
      { error: 'not-found', message: 'Không tìm thấy nội dung' },
      { status: 404 },
    )
  }

  const existing = await req.payload.find({
    collection: 'interactions',
    where: {
      and: [
        { anonId: { equals: anonId } },
        { refType: { equals: refType } },
        { refId: { equals: id } },
        { kind: { equals: kind } },
      ],
    },
    limit: 1,
  })

  let toggled: boolean
  if (existing.docs.length > 0) {
    await req.payload.delete({ collection: 'interactions', id: existing.docs[0].id })
    toggled = false
  } else {
    await req.payload.create({
      collection: 'interactions',
      data: { anonId, refType, refId: id, kind },
    })
    toggled = true
  }

  // Denormalize likeCount on posts only (when kind=like && refType=post)
  let count = 0
  if (kind === 'like' && refType === 'post') {
    const c = await req.payload.count({
      collection: 'interactions',
      where: {
        and: [
          { refType: { equals: 'post' } },
          { refId: { equals: id } },
          { kind: { equals: 'like' } },
        ],
      },
    })
    count = c.totalDocs || 0
    await req.payload
      .update({ collection: 'posts', id, data: { likeCount: count } })
      .catch((err: any) => console.error('[toggle-helper] likeCount denormalize failed', err))
  }

  const payload: Record<string, unknown> = { ok: true }
  payload[kind === 'like' ? 'liked' : 'bookmarked'] = toggled
  if (kind === 'like') payload.count = count

  const response = Response.json(payload)
  if (fresh) {
    const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    response.headers.append(
      'Set-Cookie',
      `anon_id=${encodeURIComponent(signed)}; ${COOKIE_OPTS}${secureFlag}`,
    )
  }
  return response
}
