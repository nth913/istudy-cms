import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config')

const email = process.argv[2]
const role = (process.argv[3] || 'admin') as 'admin' | 'editor' | 'reviewer' | 'student'
if (!email) {
  console.error('Usage: tsx scripts/seed/promote-admin.ts <email> [role]')
  process.exit(1)
}

const payload = await getPayload({ config })
const found = await payload.find({
  collection: 'users',
  where: { email: { equals: email } },
  limit: 1,
})
if (found.docs.length === 0) {
  console.error(`User not found: ${email}`)
  process.exit(2)
}
const u = found.docs[0]
const updated = await payload.update({
  collection: 'users',
  id: u.id,
  data: {
    role,
    name: (u as any).name && (u as any).name !== 'undefined' ? (u as any).name : email.split('@')[0],
  } as never,
  overrideAccess: true,
})
console.log(`✓ ${updated.email} → role=${(updated as any).role} name=${(updated as any).name}`)
process.exit(0)
