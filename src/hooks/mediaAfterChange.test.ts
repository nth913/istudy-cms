import { describe, it, expect, vi } from 'vitest'

vi.mock('./processing/pdf-metadata', () => ({ extractPdfMetadata: vi.fn(async () => ({ pageCount: 1 })) }))
vi.mock('./processing/pdf-thumbnail', () => ({ generatePdfThumbnail: vi.fn(async () => null) }))
vi.mock('./processing/image-process', () => ({ processImage: vi.fn(async () => ({})) }))
vi.mock('./processing/image-watermark', () => ({ watermarkImage: vi.fn(async () => Buffer.from('wm')) }))
vi.mock('../lib/r2-upload', () => ({ uploadToR2: vi.fn(async () => {}) }))

import { watermarkImage } from './processing/image-watermark'
import { mediaAfterChange } from './mediaAfterChange'

function makeReq(file: { data: Buffer; mimetype: string }) {
  return { file, payload: { update: vi.fn(async () => ({})) } }
}

describe('mediaAfterChange — watermark logic with purposes array', () => {
  it('watermarks when purposes includes exam_content', async () => {
    const req = makeReq({ data: Buffer.from('img'), mimetype: 'image/jpeg' })
    await mediaAfterChange({
      doc: { id: '1', purposes: ['exam_content'] },
      operation: 'create',
      req,
    } as any)
    await new Promise(r => setTimeout(r, 20))
    expect(watermarkImage).toHaveBeenCalled()
  })

  it('skips watermark when purposes only contains exam_thumbnail', async () => {
    vi.clearAllMocks()
    const req = makeReq({ data: Buffer.from('img'), mimetype: 'image/jpeg' })
    await mediaAfterChange({
      doc: { id: '2', purposes: ['exam_thumbnail', 'og_image'] },
      operation: 'create',
      req,
    } as any)
    await new Promise(r => setTimeout(r, 20))
    expect(watermarkImage).not.toHaveBeenCalled()
  })

  it('skips watermark when purposes is empty', async () => {
    vi.clearAllMocks()
    const req = makeReq({ data: Buffer.from('img'), mimetype: 'image/jpeg' })
    await mediaAfterChange({
      doc: { id: '3', purposes: [] },
      operation: 'create',
      req,
    } as any)
    await new Promise(r => setTimeout(r, 20))
    expect(watermarkImage).not.toHaveBeenCalled()
  })
})
