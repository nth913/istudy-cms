import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

export const examsPdfRequiredWhenPublished: CollectionBeforeValidateHook = ({ data }) => {
  if (data?._status === 'published' && !data?.pdfFile) {
    throw new APIError('Phải upload file PDF đề trước khi publish', 400)
  }
  return data
}
