import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config')

const payload = await getPayload({ config })
const u = await payload.find({ collection: 'users', limit: 50 })
console.log(`Total users: ${u.totalDocs}`)
for (const d of u.docs) {
  console.log(`  ${d.id}  ${d.email}  role=${(d as any).role}  name=${(d as any).name}`)
}
process.exit(0)
