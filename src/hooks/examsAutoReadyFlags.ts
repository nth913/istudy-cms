import type { CollectionBeforeChangeHook } from 'payload'

export const examsAutoReadyFlags: CollectionBeforeChangeHook = ({ data }) => {
  if (!data) return data
  data.deReady = Boolean(data.pdfFile)
  data.dapAnReady = Boolean(data.answerFile)
  return data
}
