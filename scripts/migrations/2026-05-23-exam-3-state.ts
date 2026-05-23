/**
 * Migration: convert exam lifecycle from 2-state (draft|published) to 3-state.
 * - All _status=draft → published
 * - deReady = !!pdfFile (auto-derived)
 * - dapAnReady = !!answerFile (auto-derived)
 *
 * Run once after deploying Plan 2026-05-23-exam-status-3-state:
 *   pnpm migrate:exam-3-state
 *
 * Idempotent: safe to re-run.
 */
import { getPayload } from 'payload'
import config from '../../src/payload.config'

async function migrate(): Promise<void> {
  const payload = await getPayload({ config })
  console.log('[migration] Loading exams...')
  const all = await payload.find({
    collection: 'exams',
    limit: 5000,
    pagination: false,
  })
  console.log(`[migration] Found ${all.totalDocs} exams.`)

  let migrated = 0
  let skipped = 0
  for (const e of all.docs as any[]) {
    const updates: Record<string, any> = {}
    if (e._status === 'draft') updates._status = 'published'
    const newDeReady = Boolean(e.pdfFile)
    const newDapAnReady = Boolean(e.answerFile)
    if (e.deReady !== newDeReady) updates.deReady = newDeReady
    if (e.dapAnReady !== newDapAnReady) updates.dapAnReady = newDapAnReady

    if (Object.keys(updates).length > 0) {
      await payload.update({
        collection: 'exams',
        id: e.id,
        data: updates,
      })
      migrated++
      console.log(`[migration] ${e.slug}: ${JSON.stringify(updates)}`)
    } else {
      skipped++
    }
  }
  console.log(
    `[migration] Done. Migrated ${migrated}, skipped ${skipped}, total ${all.totalDocs}.`,
  )
  process.exit(0)
}

migrate().catch((err) => {
  console.error('[migration] FAILED', err)
  process.exit(1)
})
