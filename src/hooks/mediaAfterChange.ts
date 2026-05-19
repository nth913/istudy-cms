import type { CollectionAfterChangeHook, Payload } from 'payload'
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

  const bufferCopy = Buffer.from(file.data)
  const mimetype = file.mimetype
  const purpose = (doc.purpose as string) ?? 'other'
  const mediaId = doc.id

  setImmediate(() => {
    void runProcessing(req.payload, mediaId, bufferCopy, mimetype, purpose)
  })

  return doc
}

async function runProcessing(
  payload: Payload,
  mediaId: string | number,
  buffer: Buffer,
  mimetype: string,
  purpose: string,
) {
  const updates: Record<string, unknown> = {}
  const derivedMeta: Record<string, unknown> = {}

  try {
    if (mimetype === 'application/pdf') {
      const pdfMeta = await extractPdfMetadata(buffer)
      derivedMeta.pageCount = pdfMeta.pageCount
      const thumbUrl = await generatePdfThumbnail(buffer, mediaId)
      if (thumbUrl) derivedMeta.firstPageThumbUrl = thumbUrl
    } else if (mimetype.startsWith('image/')) {
      const imageMeta = await processImage(buffer, mediaId)
      Object.assign(derivedMeta, imageMeta)

      if (WATERMARK_PURPOSES.has(purpose)) {
        const watermarked = await watermarkImage(buffer)
        const ext = mimetype.split('/')[1] || 'jpg'
        const key = `watermarked/${mediaId}-v1.${ext}`
        await uploadToR2(key, watermarked, mimetype)
        updates.watermarkedAt = new Date().toISOString()
        updates.watermarkVersion = 1
      }
    }

    if (Object.keys(derivedMeta).length > 0) updates.derivedMeta = derivedMeta

    if (Object.keys(updates).length > 0) {
      await payload.update({ collection: 'media', id: mediaId as string, data: updates })
    }
  } catch (err) {
    console.error('[mediaAfterChange:async] processing failed', err)
  }
}
