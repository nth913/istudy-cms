import sharp from 'sharp'
import { uploadToR2 } from '../../lib/r2-upload'

const SIZES = [400, 800, 1600] as const

export interface ImageMeta {
  width: number
  height: number
  avgColor: string
  webpVariants: Array<{ size: number; url: string }>
}

export async function processImage(buffer: Buffer, mediaId: string | number): Promise<ImageMeta> {
  const meta = await sharp(buffer).metadata()
  const { dominant } = await sharp(buffer).stats()
  const avgColor = `#${[dominant.r, dominant.g, dominant.b]
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('')}`

  const variants: ImageMeta['webpVariants'] = []
  const sourceWidth = meta.width || 0
  for (const size of SIZES) {
    if (sourceWidth < size) continue
    const variantBuf = await sharp(buffer).resize(size).webp({ quality: 80 }).toBuffer()
    const key = `image-variants/${mediaId}-${size}.webp`
    const url = await uploadToR2(key, variantBuf, 'image/webp')
    variants.push({ size, url })
  }

  return {
    width: meta.width || 0,
    height: meta.height || 0,
    avgColor,
    webpVariants: variants,
  }
}
