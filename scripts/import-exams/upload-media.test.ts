import { describe, it, expect, vi } from 'vitest'
import { uploadOrReuseMedia } from './upload-media'

describe('uploadOrReuseMedia', () => {
  it('reuses media when checksum already exists', async () => {
    const payload: any = {
      find: vi.fn().mockResolvedValue({ docs: [{ id: 'm-existing' }] }),
      create: vi.fn(),
    }
    const buf = Buffer.from('hello world')
    const r = await uploadOrReuseMedia(payload, { filename: 'de.pdf', mimetype: 'application/pdf', data: buf })
    expect(r.status).toBe('reused')
    expect(r.id).toBe('m-existing')
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('uploads when no checksum match', async () => {
    const payload: any = {
      find: vi.fn().mockResolvedValue({ docs: [] }),
      create: vi.fn().mockResolvedValue({ id: 'm-new' }),
    }
    const r = await uploadOrReuseMedia(payload, { filename: 'de.pdf', mimetype: 'application/pdf', data: Buffer.from('x') })
    expect(r.status).toBe('uploaded')
    expect(r.id).toBe('m-new')
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'media',
      data: expect.objectContaining({ alt: 'de.pdf' }),
      file: expect.objectContaining({ name: 'de.pdf' }),
    })
  })
})
