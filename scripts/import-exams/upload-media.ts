import type { Payload } from 'payload'
import { sha256Hex } from '../../src/lib/checksum'

export type MediaInput = { filename: string; mimetype: string; data: Buffer }
export type MediaResult = { status: 'reused' | 'uploaded' | 'error'; id?: string | number; message?: string }

export async function uploadOrReuseMedia(payload: Payload, input: MediaInput): Promise<MediaResult> {
  try {
    const checksum = sha256Hex(input.data)
    const existing = await payload.find({
      collection: 'media' as any,
      where: { checksum: { equals: checksum } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) return { status: 'reused', id: existing.docs[0].id }

    const created = await payload.create({
      collection: 'media' as any,
      data: { alt: input.filename, checksum } as any,
      file: { name: input.filename, mimetype: input.mimetype, data: input.data, size: input.data.length } as any,
    })
    return { status: 'uploaded', id: created.id }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
}
