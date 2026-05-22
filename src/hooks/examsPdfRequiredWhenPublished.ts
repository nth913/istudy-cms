import type { CollectionBeforeValidateHook } from 'payload'

export const examsPdfRequiredWhenPublished: CollectionBeforeValidateHook = ({ data }) => {
  if (data?._status === 'published' && !data?.pdfFile) {
    throw new Error('Phải upload file PDF đề trước khi publish')
  }
  return data
}
