import type { CollectionBeforeValidateHook } from 'payload'
import { sanitizeFilename } from '../lib/filename-sanitize'
import { sha256Hex } from '../lib/checksum'

const PDF_MAX = 20 * 1024 * 1024
const IMAGE_MAX = 5 * 1024 * 1024

type UploadedFile = {
  data: Buffer
  mimetype: string
  size: number
  name: string
}

export const mediaBeforeValidate: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  if (operation !== 'create') return data

  const file = (req as unknown as { file?: UploadedFile }).file
  if (!file) return data

  const isPdf = file.mimetype === 'application/pdf'
  const max = isPdf ? PDF_MAX : IMAGE_MAX
  if (file.size > max) {
    throw new Error(
      `File quá dung lượng: ${(file.size / 1024 / 1024).toFixed(1)}MB (tối đa ${(max / 1024 / 1024).toFixed(0)}MB)`,
    )
  }

  file.name = sanitizeFilename(file.name)
  const next = (data ?? {}) as Record<string, unknown>
  next.checksum = sha256Hex(file.data)
  return next
}
