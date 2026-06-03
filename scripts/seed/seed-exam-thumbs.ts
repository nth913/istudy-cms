// istudy-cms/scripts/seed/seed-exam-thumbs.ts
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config')
const { seedExamThumbs } = await import('../../src/seed/exam-thumbs')

const payload = await getPayload({ config })
await seedExamThumbs(payload)
process.exit(0)
