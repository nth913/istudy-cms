import type { CollectionBeforeChangeHook } from 'payload'

export const examsAutoReadyFlags: CollectionBeforeChangeHook = ({ data }) => {
  if (!data) return data
  // Only recompute when the source upload field is part of this change. On a
  // partial update (e.g. the thumbnail backfill migration) the keys are absent
  // and Payload preserves the stored flag via its originalDoc merge.
  if ('pdfFile' in data) data.deReady = Boolean(data.pdfFile)
  if ('answerFile' in data) data.dapAnReady = Boolean(data.answerFile)
  return data
}
