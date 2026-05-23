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
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function migrate(): Promise<void> {
  // Defer payload imports until AFTER dotenv loads env vars.
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')

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
      let lastErr: unknown
      let success = false
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          await payload.update({
            collection: 'exams',
            id: e.id,
            data: updates,
          })
          success = true
          break
        } catch (err: any) {
          lastErr = err
          if (err?.code === 112 || err?.codeName === 'WriteConflict') {
            const backoff = 500 * attempt
            console.warn(`[migration] WriteConflict on ${e.slug}, retry ${attempt}/5 after ${backoff}ms`)
            await new Promise((r) => setTimeout(r, backoff))
            continue
          }
          throw err
        }
      }
      if (!success) throw lastErr
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
