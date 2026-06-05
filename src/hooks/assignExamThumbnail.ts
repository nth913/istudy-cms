// istudy-cms/src/hooks/assignExamThumbnail.ts
import type { CollectionBeforeChangeHook } from 'payload'
import { pickPresetIndex } from '../lib/thumbnail-pick'

let warnedEmptyPool = false

export const assignExamThumbnail: CollectionBeforeChangeHook = async ({ data, req, context }) => {
  if (!data) return data
  if (context?.skipThumbnailHook) return data

  if (data.thumbnail) {
    data.thumbnailAuto = false
    return data
  }

  const pool = await req.payload.find({
    collection: 'media' as any,
    where: { purposes: { contains: 'exam_thumbnail' } },
    sort: 'filename',
    limit: 100,
    depth: 0,
  })

  if (pool.docs.length === 0) {
    if (!warnedEmptyPool) {
      console.warn('[assignExamThumbnail] no exam_thumbnail presets seeded — run `pnpm seed:exam-thumbs`')
      warnedEmptyPool = true
    }
    return data
  }

  const idx = pickPresetIndex(String(data.slug ?? ''), pool.docs.length)
  data.thumbnail = pool.docs[idx].id
  data.thumbnailAuto = true
  return data
}
