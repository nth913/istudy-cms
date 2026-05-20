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

// Payload stores active edit locks in `payload-locked-documents`. List + clear.
const found = await payload.find({
  collection: 'payload-locked-documents' as never,
  limit: 100,
  overrideAccess: true,
} as never)

console.log(`Active locks: ${(found as any).totalDocs}`)
for (const d of (found as any).docs) {
  console.log('  lock:', JSON.stringify(d, null, 2))
}

if (process.argv.includes('--clear')) {
  for (const d of (found as any).docs) {
    await payload.delete({
      collection: 'payload-locked-documents' as never,
      id: d.id,
      overrideAccess: true,
    } as never)
    console.log(`  ✓ cleared ${d.id}`)
  }
}
process.exit(0)
