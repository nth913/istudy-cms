import type { Payload } from 'payload'

interface SampleEvent {
  title: string
  slug: string
  short: string
  heroEyebrow: string
  kind: 'live-exam' | 'announcement' | 'launch' | 'promo'
  startAt: string
  endAt: string
  examEndTime: string
  submenu: string
  priority: number
  leadDays: number
  deReady: boolean
  dapAnReady: boolean
  dePostedAt?: string
  dapAnPostedAt?: string
  surfaces: Array<'header-mega' | 'homepage-hero' | 'cho-de'>
  ctaLabel: string
  ctaHref: string
}

const SAMPLES: SampleEvent[] = [
  {
    title: 'Kỳ thi tốt nghiệp THPT Quốc gia 2026 — Môn Tiếng Anh',
    slug: 'thpt-qg-2026',
    short: 'THPT Quốc gia 2026',
    heroEyebrow: 'Mùa thi 2026',
    kind: 'live-exam',
    startAt: '2026-06-27T07:30:00+07:00',
    endAt: '2026-06-27T23:59:00+07:00',
    examEndTime: '2026-06-27T09:30:00+07:00',
    submenu: 'thpt-qg',
    priority: 10,
    leadDays: 30,
    deReady: false,
    dapAnReady: false,
    surfaces: ['header-mega', 'homepage-hero'],
    ctaLabel: 'Vào hóng đề',
    ctaHref: '/cho-de?event=thpt-qg-2026',
  },
  {
    title: 'Đề thi vào 10 — THPT Chuyên Nguyễn Trãi (Hải Dương)',
    slug: 'vao10-nguyen-trai-hd',
    short: 'Vào 10 Chuyên Nguyễn Trãi',
    heroEyebrow: 'Tuyển sinh Hải Dương',
    kind: 'live-exam',
    startAt: '2026-05-25T07:30:00+07:00',
    endAt: '2026-05-25T23:59:00+07:00',
    examEndTime: '2026-05-25T09:30:00+07:00',
    submenu: 'vao-10',
    priority: 20,
    leadDays: 14,
    deReady: true,
    dapAnReady: true,
    dePostedAt: '2026-05-25T10:15:00+07:00',
    dapAnPostedAt: '2026-05-25T14:30:00+07:00',
    surfaces: ['header-mega'],
    ctaLabel: 'Xem đáp án',
    ctaHref: '/dap-an?event=vao10-nguyen-trai-hd',
  },
]

export async function seedEvents(payload: Payload) {
  console.log('Seeding Events...')
  let created = 0
  for (const sample of SAMPLES) {
    const existing = await payload.find({
      collection: 'events',
      where: { slug: { equals: sample.slug } },
      limit: 1,
    })
    if (existing.docs.length > 0) continue

    await payload.create({
      collection: 'events',
      data: {
        title: sample.title,
        slug: sample.slug,
        short: sample.short,
        heroEyebrow: sample.heroEyebrow,
        kind: sample.kind,
        startAt: sample.startAt,
        endAt: sample.endAt,
        examEndTime: sample.examEndTime,
        submenu: sample.submenu,
        priority: sample.priority,
        leadDays: sample.leadDays,
        deReady: sample.deReady,
        dapAnReady: sample.dapAnReady,
        ...(sample.dePostedAt ? { dePostedAt: sample.dePostedAt } : {}),
        ...(sample.dapAnPostedAt ? { dapAnPostedAt: sample.dapAnPostedAt } : {}),
        surfaces: sample.surfaces,
        cta: { label: sample.ctaLabel, href: sample.ctaHref },
        subject: 'Tiếng Anh',
        manualPin: { hero: false, popup: false },
        _status: 'published',
      } as never,
    })
    created++
  }
  console.log(`✓ Events: ${created} created (${SAMPLES.length - created} existed)`)
}
