import type { Payload } from 'payload'
import { vietnameseSlugify } from '../../src/lib/vietnamese-slugify'

export type UpsertInput = {
  title: string
  slug?: string
  category: 'vao-10' | 'vao-dai-hoc'
  examType: 'chinh-thuc' | 'thi-thu' | 'minh-hoa'
  year: string
  subjectId?: string | number
  provinceId?: string | number
  school?: string
  pdfFileId: string | number
  answerFileId?: string | number
}

export type UpsertResult = {
  status: 'created' | 'updated' | 'error'
  id?: string | number
  slug?: string
  message?: string
}

export async function upsertExam(payload: Payload, input: UpsertInput): Promise<UpsertResult> {
  try {
    const slug = input.slug || vietnameseSlugify(input.title)
    const data: Record<string, unknown> = {
      title: input.title,
      slug,
      category: input.category,
      examType: input.examType,
      year: input.year,
      pdfFile: input.pdfFileId,
      _status: 'draft',
    }
    if (input.subjectId) data.subject = input.subjectId
    if (input.provinceId) data.province = input.provinceId
    if (input.school) data.school = input.school
    if (input.answerFileId) data.answerFile = input.answerFileId

    const existing = await payload.find({
      collection: 'exams' as any,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })

    if (existing.docs[0]) {
      const doc = await payload.update({
        collection: 'exams' as any,
        id: existing.docs[0].id,
        data,
      })
      return { status: 'updated', id: doc.id, slug }
    }

    const doc = await payload.create({
      collection: 'exams' as any,
      data,
    })
    return { status: 'created', id: doc.id, slug }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
}
