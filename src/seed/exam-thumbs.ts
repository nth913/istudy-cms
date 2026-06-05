// istudy-cms/src/seed/exam-thumbs.ts
import type { Payload } from 'payload'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sha256Hex } from '../lib/checksum'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = path.resolve(dirname, 'assets/exam-thumbs')

/** Human Vietnamese alt text per preset filename. Falls back to the basename. */
export const EXAM_THUMB_ALT: Record<string, string> = {
  'mascot-cheer.png': 'Linh vật cổ vũ mùa thi',
  'may-mo-mang.png': 'Mây mơ màng — phong cách pastel',
  'meo-doc-sach.png': 'Mèo đọc sách',
  'meo-pastel.png': 'Mèo pastel dễ thương',
  'mua-thi-anh.png': 'Mùa thi — ảnh minh hoạ',
  'mua-thi.png': 'Mùa thi',
  'phuong-anh.png': 'Hoa phượng mùa thi',
  'phuong-polaroid.png': 'Hoa phượng phong cách polaroid',
  'phuong-tem.png': 'Hoa phượng phong cách tem',
  'phuong-washi.png': 'Hoa phượng phong cách washi',
  'si-tu.png': 'Sĩ tử ôn thi',
  'sticker-co-vn.png': 'Sticker cờ Việt Nam',
  'thi-la-do.png': 'Thi là đỗ — cổ vũ',
}

export async function seedExamThumbs(payload: Payload): Promise<void> {
  let files: string[] = []
  try {
    files = fs.readdirSync(ASSETS_DIR).filter((f) => /\.png$/i.test(f)).sort()
  } catch {
    console.warn(`[seedExamThumbs] assets dir missing: ${ASSETS_DIR}`)
    return
  }

  let uploaded = 0
  let reused = 0
  for (const filename of files) {
    const data = fs.readFileSync(path.join(ASSETS_DIR, filename))
    const checksum = sha256Hex(data)
    const existing = await payload.find({
      collection: 'media' as any,
      where: { checksum: { equals: checksum } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) {
      reused++
      continue
    }
    await payload.create({
      collection: 'media' as any,
      data: {
        alt: EXAM_THUMB_ALT[filename] ?? filename.replace(/\.png$/i, ''),
        checksum,
        purposes: ['exam_thumbnail'],
        visibility: 'public',
      } as any,
      file: { name: filename, mimetype: 'image/png', data, size: data.length } as any,
    })
    uploaded++
  }
  console.log(`✓ Exam thumbnails: ${uploaded} uploaded, ${reused} reused (${files.length} total)`)
}
