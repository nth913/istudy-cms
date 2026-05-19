import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { uploadToR2 } from '../../lib/r2-upload'

export async function generatePdfThumbnail(pdfBuffer: Buffer, mediaId: string | number): Promise<string | null> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdfthumb-'))
  const inPath = path.join(tmpDir, 'in.pdf')
  const outPrefix = path.join(tmpDir, 'page')
  try {
    await fs.writeFile(inPath, pdfBuffer)
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(process.env.POPPLER_PATH || 'pdftoppm', [
        '-f', '1',
        '-l', '1',
        '-jpeg',
        '-r', '100',
        '-scale-to-x', '400',
        '-scale-to-y', '-1',
        inPath,
        outPrefix,
      ])
      proc.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`pdftoppm exit ${code}`))))
      proc.on('error', reject)
    })
    const thumbPath = `${outPrefix}-1.jpg`
    const thumbBuffer = await fs.readFile(thumbPath)
    const key = `pdf-thumbs/${mediaId}.jpg`
    return await uploadToR2(key, thumbBuffer, 'image/jpeg')
  } catch (err) {
    console.error('[pdf-thumbnail] generation failed', err)
    return null
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
