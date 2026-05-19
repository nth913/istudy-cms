import { PDFParse } from 'pdf-parse'

export async function extractPdfMetadata(buffer: Buffer): Promise<{ pageCount: number }> {
  let parser: PDFParse | null = null
  try {
    parser = new PDFParse({ data: new Uint8Array(buffer) })
    const info = await parser.getInfo()
    return { pageCount: info.total ?? 0 }
  } catch (err) {
    console.error('[pdf-metadata] extract failed', err)
    return { pageCount: 0 }
  } finally {
    await parser?.destroy().catch(() => {})
  }
}
