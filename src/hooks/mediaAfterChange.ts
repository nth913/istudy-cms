import type { CollectionAfterChangeHook } from 'payload'
import { extractPdfMetadata } from './processing/pdf-metadata'
import { generatePdfThumbnail } from './processing/pdf-thumbnail'
import { processImage } from './processing/image-process'
import { watermarkImage } from './processing/image-watermark'
import { uploadToR2 } from '../lib/r2-upload'

const WATERMARK_PURPOSES = new Set(['exam_content', 'exam_answer', 'exam_solution'])

type UploadedFile = {
  data: Buffer
  mimetype: string
}

export const mediaAfterChange: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation !== 'create') return doc

  const file = (req as unknown as { file?: UploadedFile }).file
  if (!file) return doc

  const updates: Record<string, unknown> = {}
  const derivedMeta: Record<string, unknown> = {}

  try {
    if (file.mimetype === 'application/pdf') {
      const pdfMeta = await extractPdfMetadata(file.data)
      derivedMeta.pageCount = pdfMeta.pageCount
      const thumbUrl = await generatePdfThumbnail(file.data, doc.id)
      if (thumbUrl) derivedMeta.firstPageThumbUrl = thumbUrl
    } else if (file.mimetype.startsWith('image/')) {
      const imageMeta = await processImage(file.data, doc.id)
      Object.assign(derivedMeta, imageMeta)

      if (WATERMARK_PURPOSES.has(doc.purpose)) {
        const watermarked = await watermarkImage(file.data)
        const ext = file.mimetype.split('/')[1] || 'jpg'
        const key = `watermarked/${doc.id}-v1.${ext}`
        await uploadToR2(key, watermarked, file.mimetype)
        updates.watermarkedAt = new Date().toISOString()
        updates.watermarkVersion = 1
      }
    }

    if (Object.keys(derivedMeta).length > 0) updates.derivedMeta = derivedMeta

    if (Object.keys(updates).length > 0) {
      await req.payload.update({ collection: 'media', id: doc.id, data: updates })
    }
  } catch (err) {
    console.error('[mediaAfterChange] processing failed', err)
  }
  return doc
}
