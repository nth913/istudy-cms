import type { Endpoint, PayloadRequest } from 'payload'
import { parseExamsCsv } from '../../scripts/import-exams/parse-csv'
import { upsertExam } from '../../scripts/import-exams/upsert-exam'
import { uploadOrReuseMedia } from '../../scripts/import-exams/upload-media'
import { resolveProvinceId, resolveSubjectId } from '../../scripts/import-exams/resolve-refs'

type Body = { csv: string; files: { name: string; base64: string }[] }

export const importExamsCsvEndpoint: Endpoint = {
  path: '/admin/import/exams/csv',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
      return Response.json({ error: 'Cần quyền admin hoặc editor' }, { status: 403 })
    }
    const body = (await req.json?.()) as Body | undefined
    if (!body?.csv) return Response.json({ error: 'csv body required' }, { status: 400 })

    const parsed = parseExamsCsv(body.csv)
    if (parsed.headerError) return Response.json({ error: parsed.headerError }, { status: 400 })

    const fileMap = new Map<string, Buffer>()
    for (const f of body.files || []) fileMap.set(f.name, Buffer.from(f.base64, 'base64'))

    const log: Array<Record<string, unknown>> = []
    let created = 0
    let updated = 0
    let errors = parsed.errors.length
    for (const e of parsed.errors) log.push({ rowIndex: e.rowIndex, status: 'error', message: e.message })

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i]
      const pdfBuf = fileMap.get(row.pdfFileName)
      if (!pdfBuf) {
        errors++
        log.push({ rowIndex: i, status: 'error', message: `file missing: ${row.pdfFileName}` })
        continue
      }
      const media = await uploadOrReuseMedia(req.payload, {
        filename: row.pdfFileName, mimetype: 'application/pdf', data: pdfBuf,
      })
      if (media.status === 'error' || !media.id) {
        errors++
        log.push({ rowIndex: i, status: 'error', message: media.message || 'media upload failed' })
        continue
      }

      let answerFileId: string | number | undefined
      if (row.answerFileName) {
        const buf = fileMap.get(row.answerFileName)
        if (buf) {
          const ans = await uploadOrReuseMedia(req.payload, { filename: row.answerFileName, mimetype: 'application/pdf', data: buf })
          if (ans.id) answerFileId = ans.id
        }
      }

      const [subjectId, provinceId] = await Promise.all([
        resolveSubjectId(req.payload, row.subjectSlug),
        resolveProvinceId(req.payload, row.provinceSlug),
      ])

      const result = await upsertExam(req.payload, {
        title: row.title,
        slug: row.slug,
        category: row.category,
        examType: row.examType,
        year: row.year,
        subjectId,
        provinceId,
        school: row.school,
        pdfFileId: media.id,
        answerFileId,
      })
      if (result.status === 'created') created++
      else if (result.status === 'updated') updated++
      else errors++
      log.push({ rowIndex: i, status: result.status, id: result.id, slug: result.slug, message: result.message })
    }

    return Response.json({ summary: { created, updated, errors }, log })
  },
}
