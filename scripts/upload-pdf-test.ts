import { getPayload } from 'payload'
import { readFileSync } from 'fs'
import { config as loadEnv } from 'dotenv'
import path from 'path'
import payloadConfig from '../src/payload.config'

loadEnv({ path: path.resolve(process.cwd(), '.env.local') })

async function main() {
  console.log('Boot Payload local API...')
  const payload = await getPayload({ config: payloadConfig })

  const pdfPath = '/tmp/sample.pdf'
  const buf = readFileSync(pdfPath)
  console.log(`PDF loaded: ${buf.length} bytes`)

  console.log('Creating media doc with PDF upload...')
  const result = await payload.create({
    collection: 'media',
    data: { alt: 'smoke test PDF' },
    file: {
      data: buf,
      mimetype: 'application/pdf',
      name: `smoke-test-${Date.now()}.pdf`,
      size: buf.length,
    },
  })

  console.log('--- Result ---')
  console.log('id:', result.id)
  console.log('filename:', result.filename)
  console.log('mimeType:', result.mimeType)
  console.log('filesize:', result.filesize)
  console.log('url:', result.url)

  console.log('\n--- Fetching URL ---')
  if (result.url) {
    const fetchUrl = result.url.startsWith('http') ? result.url : `http://localhost:3131${result.url}`
    const res = await fetch(fetchUrl)
    console.log('Status:', res.status, 'Content-Type:', res.headers.get('content-type'))
  }

  console.log('\n--- Cleanup (delete) ---')
  await payload.delete({ collection: 'media', id: result.id })
  console.log('Deleted media doc', result.id)

  process.exit(0)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
