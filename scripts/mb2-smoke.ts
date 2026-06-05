import { getPayload } from 'payload'
import { readFileSync, existsSync } from 'fs'
import { config as loadEnv } from 'dotenv'
import path from 'path'
import { spawnSync } from 'child_process'
import payloadConfig from '../src/payload.config'

loadEnv({ path: path.resolve(process.cwd(), '.env.local') })

async function generateSamplePdf(): Promise<Buffer> {
  const tmpPdf = '/tmp/mb2-smoke-sample.pdf'
  if (existsSync(tmpPdf)) return readFileSync(tmpPdf)
  spawnSync('sh', ['-c', `printf '%%PDF-1.4\\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<<>>>>endobj\\n4 0 obj<</Length 44>>stream\\nBT /F1 12 Tf 50 800 Td (MB2 smoke test) Tj ET\\nendstream endobj\\nxref\\n0 5\\n0000000000 65535 f \\ntrailer<</Size 5/Root 1 0 R>>\\nstartxref\\n0\\n%%EOF\\n' > ${tmpPdf}`])
  return readFileSync(tmpPdf)
}

async function generateSampleImage(): Promise<Buffer> {
  const tmpImg = '/tmp/mb2-smoke-sample.png'
  if (existsSync(tmpImg)) return readFileSync(tmpImg)
  const sharp = (await import('sharp')).default
  const buf = await sharp({
    create: { width: 1200, height: 800, channels: 3, background: { r: 80, g: 120, b: 200 } },
  })
    .png()
    .toBuffer()
  return buf
}

async function main() {
  console.log('Boot Payload local API…')
  const payload = await getPayload({ config: payloadConfig })

  console.log('\n=== Test 1: PDF upload (purpose=exam_content) ===')
  const pdfPath = process.env.MB2_SMOKE_PDF || '/tmp/sample.pdf'
  let pdfDoc: Record<string, unknown> | null = null
  if (!existsSync(pdfPath)) {
    console.log(`  SKIP — no real PDF at ${pdfPath}. Set MB2_SMOKE_PDF=/path/to/real.pdf to enable.`)
  } else {
    const pdfBuf = readFileSync(pdfPath)
    pdfDoc = (await payload.create({
      collection: 'media',
      data: { alt: 'MB2 smoke PDF', purposes: ['exam_content'] },
      file: {
        data: pdfBuf,
        mimetype: 'application/pdf',
        name: `Đề thi thử 2026!@.pdf`,
        size: pdfBuf.length,
      },
    })) as unknown as Record<string, unknown>
    console.log('  id:', pdfDoc.id)
    console.log('  filename:', pdfDoc.filename, '(expect sanitized: de-thi-thu-2026.pdf)')
    console.log('  checksum:', pdfDoc.checksum)
    console.log('  purposes:', pdfDoc.purposes)
    await new Promise((r) => setTimeout(r, 6000))
    const pdfRefresh = (await payload.findByID({ collection: 'media', id: pdfDoc.id as string })) as unknown as Record<string, unknown>
    const pdfMeta = pdfRefresh.derivedMeta as unknown as Record<string, unknown> | undefined
    console.log('  derivedMeta:', pdfMeta)
    console.log('    pageCount:', pdfMeta?.pageCount)
    console.log('    firstPageThumbUrl:', pdfMeta?.firstPageThumbUrl)
  }

  console.log('\n=== Test 2: Image upload (purpose=exam_content) ===')
  const imgBuf = await generateSampleImage()
  const imgDoc = (await payload.create({
    collection: 'media',
    data: { alt: 'MB2 smoke image', purposes: ['exam_content'] },
    file: {
      data: imgBuf,
      mimetype: 'image/png',
      name: `Ảnh đề 2026.png`,
      size: imgBuf.length,
    },
  })) as unknown as Record<string, unknown>
  console.log('  id:', imgDoc.id)
  console.log('  filename:', imgDoc.filename)
  console.log('  checksum:', imgDoc.checksum)
  console.log('  waiting 8s for async processing…')
  await new Promise((r) => setTimeout(r, 8000))
  const imgRefresh = (await payload.findByID({ collection: 'media', id: imgDoc.id as string })) as unknown as Record<string, unknown>
  const imgMeta = imgRefresh.derivedMeta as unknown as Record<string, unknown> | undefined
  console.log('  derivedMeta:', imgMeta)
  console.log('  watermarkedAt:', imgRefresh.watermarkedAt)
  console.log('  watermarkVersion:', imgRefresh.watermarkVersion)

  console.log('\n=== Cleanup ===')
  if (pdfDoc) {
    await payload.delete({ collection: 'media', id: pdfDoc.id as string })
    console.log('  Deleted PDF doc')
  }
  await payload.delete({ collection: 'media', id: imgDoc.id as string })
  console.log('  Deleted image doc')

  process.exit(0)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
