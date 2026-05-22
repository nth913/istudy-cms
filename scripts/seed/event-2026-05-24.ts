import type { Payload } from 'payload'
import sidebarDefaults from './event-2026-05-24-sidebar-defaults.json' with { type: 'json' }

async function findOrCreate<T>(
  payload: Payload,
  collection: string,
  slug: string,
  data: any,
): Promise<T> {
  const existing = await payload.find({
    collection: collection as any,
    where: { slug: { equals: slug } },
    limit: 1,
  })
  if (existing.docs[0]) {
    return (await payload.update({
      collection: collection as any,
      id: (existing.docs[0] as any).id,
      data,
    })) as T
  }
  return (await payload.create({
    collection: collection as any,
    data: { ...data, slug },
  })) as T
}

export async function seedEvent20260524(payload: Payload): Promise<void> {
  const provNB = await payload.find({
    collection: 'provinces' as any,
    where: { slug: { equals: 'ninh-binh' } },
    limit: 1,
  })
  const provDN = await payload.find({
    collection: 'provinces' as any,
    where: { slug: { equals: 'da-nang' } },
    limit: 1,
  })
  if (!provNB.docs[0] || !provDN.docs[0]) {
    throw new Error('Provinces ninh-binh + da-nang phải được seed trước')
  }

  const examNB = await findOrCreate<{ id: string }>(payload, 'exams', 'exam-vao-10-ninh-binh-2026', {
    title: 'Đề thi vào 10 Ninh Bình 2026 — Môn Tiếng Anh',
    category: 'vao-10',
    examType: 'chinh-thuc',
    year: '2026',
    province: (provNB.docs[0] as any).id,
    views: 31,
    _status: 'draft',
  })
  const examDN = await findOrCreate<{ id: string }>(payload, 'exams', 'exam-vao-10-da-nang-2026', {
    title: 'Đề thi vào 10 Đà Nẵng 2026 — Môn Tiếng Anh',
    category: 'vao-10',
    examType: 'chinh-thuc',
    year: '2026',
    province: (provDN.docs[0] as any).id,
    views: 94,
    _status: 'draft',
  })

  await findOrCreate(payload, 'events', 'event-vao-10-ninh-binh-2026', {
    title: 'Thi vào 10 Ninh Bình 2026',
    short: 'Vào 10 NB',
    kind: 'live-exam',
    submenu: 'vao-10',
    startAt: '2026-05-24T07:30:00+07:00',
    endAt: '2026-05-25T00:00:00+07:00',
    examEndTime: '2026-05-24T09:30:00+07:00',
    heroEyebrow: 'Tuyển sinh Ninh Bình 2026',
    examRef: examNB.id,
    deReady: false,
    dapAnReady: false,
    priority: 10,
    leadDays: 7,
    surfaces: ['header-mega', 'homepage-hero', 'cho-de'],
  })
  await findOrCreate(payload, 'events', 'event-vao-10-da-nang-2026', {
    title: 'Thi vào 10 Đà Nẵng 2026',
    short: 'Vào 10 ĐN',
    kind: 'live-exam',
    submenu: 'vao-10',
    startAt: '2026-05-24T07:30:00+07:00',
    endAt: '2026-05-25T00:00:00+07:00',
    examEndTime: '2026-05-24T09:30:00+07:00',
    heroEyebrow: 'Tuyển sinh Đà Nẵng 2026',
    examRef: examDN.id,
    deReady: false,
    dapAnReady: false,
    priority: 11,
    leadDays: 7,
    surfaces: ['header-mega', 'homepage-hero', 'cho-de'],
  })

  await (payload as any).updateGlobal({
    slug: 'kho_de_sidebar_config',
    data: sidebarDefaults,
  })
}

// Standalone runner (ESM-compatible)
import { pathToFileURL } from 'url'
import path from 'path'
import { fileURLToPath } from 'url'
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ;(async () => {
    const dotenv = (await import('dotenv')).default
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
    dotenv.config({ path: path.resolve(__dirname, '../../.env') })

    const { getPayload } = await import('payload')
    const config = (await import('../../src/payload.config')).default
    const payload = await getPayload({ config })
    await seedEvent20260524(payload)
    console.log('✅ Seeded 2 events + 2 exam drafts + sidebar config')
    process.exit(0)
  })().catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
}
