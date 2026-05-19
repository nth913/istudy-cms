import type { Payload } from 'payload'

export async function resolveProvinceId(payload: Payload, slug: string | undefined) {
  if (!slug) return undefined
  const r = await payload.find({
    collection: 'provinces' as any,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return r.docs[0]?.id
}

export async function resolveSubjectId(payload: Payload, slug: string | undefined) {
  if (!slug) return undefined
  const r = await payload.find({
    collection: 'subjects' as any,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return r.docs[0]?.id
}
