import type { Endpoint, PayloadRequest } from 'payload'
import { parseExamFilename } from '../../scripts/import-exams/parse-filename'
import { upsertExam } from '../../scripts/import-exams/upsert-exam'
import { uploadOrReuseMedia } from '../../scripts/import-exams/upload-media'
import { resolveProvinceId, resolveSubjectId } from '../../scripts/import-exams/resolve-refs'

type Body = { files: { name: string; base64: string }[] }

function titleFromSlug(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export const importExamsBulkPdfEndpoint: Endpoint = {
  path: '/admin/import/exams/bulk-pdf',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
      return Response.json({ error: 'Cần quyền admin hoặc editor' }, { status: 403 })
    }
    const body = (await req.json?.()) as Body | undefined
    if (!body?.files?.length) return Response.json({ error: 'files required' }, { status: 400 })

    const log: Array<Record<string, unknown>> = []
    let created = 0, updated = 0, errors = 0

    for (let i = 0; i < body.files.length; i++) {
      const f = body.files[i]
      const parsed = parseExamFilename(f.name)
      if (!parsed.ok) {
        errors++
        log.push({ filename: f.name, status: 'error', message: parsed.error })
        continue
      }
      const meta = parsed.data
      const buf = Buffer.from(f.base64, 'base64')
      const media = await uploadOrReuseMedia(req.payload, { filename: f.name, mimetype: 'application/pdf', data: buf })
      if (!media.id) {
        errors++
        log.push({ filename: f.name, status: 'error', message: media.message })
        continue
      }
      const [subjectId, provinceId] = await Promise.all([
        resolveSubjectId(req.payload, meta.subjectSlug),
        resolveProvinceId(req.payload, meta.provinceSlug),
      ])

      const result = await upsertExam(req.payload, {
        title: titleFromSlug(meta.titleSlug),
        slug: meta.titleSlug,
        category: meta.category,
        examType: meta.examType,
        year: meta.year,
        subjectId,
        provinceId,
        pdfFileId: media.id,
      })
      if (result.status === 'created') created++
      else if (result.status === 'updated') updated++
      else errors++
      log.push({ filename: f.name, status: result.status, slug: result.slug, id: result.id })
    }

    return Response.json({ summary: { created, updated, errors }, log })
  },
}
