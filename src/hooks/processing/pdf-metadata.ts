type Parser = { destroy: () => Promise<void>; getInfo: () => Promise<{ total: number }> }

export async function extractPdfMetadata(buffer: Buffer): Promise<{ pageCount: number }> {
  let parser: Parser | null = null
  try {
    const mod = await import('pdf-parse')
    const PDFParseCtor = mod.PDFParse as unknown as new (opts: { data: Uint8Array }) => Parser
    parser = new PDFParseCtor({ data: new Uint8Array(buffer) })
    const info = await parser.getInfo()
    return { pageCount: info.total ?? 0 }
  } catch (err) {
    console.error('[pdf-metadata] extract failed', err)
    return { pageCount: 0 }
  } finally {
    await parser?.destroy().catch(() => {})
  }
}
