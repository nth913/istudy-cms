import type { Payload } from 'payload'

interface SampleEvent {
  title: string
  slug: string
  kind: 'live-exam' | 'announcement' | 'launch' | 'promo'
  startOffsetDays: number
  endOffsetDays: number
  surfaces: Array<'header-mega' | 'homepage-hero' | 'cho-de'>
  ctaLabel: string
  ctaHref: string
}

const SAMPLES: SampleEvent[] = [
  {
    title: 'Thi thử KSCL Tuyển sinh vào 10 - Đợt 1',
    slug: 'thi-thu-kscl-vao-10-dot-1',
    kind: 'live-exam',
    startOffsetDays: 1,
    endOffsetDays: 7,
    surfaces: ['header-mega', 'cho-de'],
    ctaLabel: 'Đăng ký ngay',
    ctaHref: '/cho-de',
  },
  {
    title: 'Ra mắt kho đề thi mới 2026',
    slug: 'ra-mat-kho-de-thi-2026',
    kind: 'launch',
    startOffsetDays: -1,
    endOffsetDays: 14,
    surfaces: ['homepage-hero'],
    ctaLabel: 'Khám phá ngay',
    ctaHref: '/kho-de-thi',
  },
]

export async function seedEvents(payload: Payload) {
  console.log('Seeding Events...')
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
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
        kind: sample.kind,
        startAt: new Date(now + sample.startOffsetDays * day).toISOString(),
        endAt: new Date(now + sample.endOffsetDays * day).toISOString(),
        surfaces: sample.surfaces,
        cta: { label: sample.ctaLabel, href: sample.ctaHref },
        _status: 'published',
      } as never,
    })
    created++
  }
  console.log(`✓ Events: ${created} created (${SAMPLES.length - created} existed)`)
}
