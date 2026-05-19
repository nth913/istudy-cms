import sharp from 'sharp'

const WATERMARK_TEXT = 'aistudy.com.vn'

export async function watermarkImage(buffer: Buffer): Promise<Buffer> {
  const meta = await sharp(buffer).metadata()
  const w = meta.width || 800
  const h = meta.height || 600

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="wm" x="0" y="0" width="240" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
      <text x="0" y="60" fill="rgba(0,0,0,0.18)" font-family="Arial, sans-serif" font-size="22" font-weight="bold">${WATERMARK_TEXT}</text>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#wm)"/>
</svg>`

  return sharp(buffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toBuffer()
}
