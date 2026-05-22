import { describe, it, expect } from 'vitest'
import { seedEvent20260524 } from './event-2026-05-24'

function makeStore() {
  const exams: any[] = []
  const events: any[] = []
  const provinces: any[] = [
    { id: 'p-nb', slug: 'ninh-binh', name: 'Ninh Bình' },
    { id: 'p-dn', slug: 'da-nang', name: 'Đà Nẵng' },
  ]
  let globalCfg: any = null
  const payload = {
    find: async ({ collection, where }: any) => {
      const table =
        collection === 'exams' ? exams : collection === 'events' ? events : provinces
      const slug = where?.slug?.equals
      const docs = slug ? table.filter((d) => d.slug === slug) : table
      return { docs, totalDocs: docs.length }
    },
    create: async ({ collection, data }: any) => {
      const table = collection === 'exams' ? exams : events
      const doc = {
        id: `${collection}-${table.length + 1}`,
        ...data,
        _status: data._status || 'draft',
      }
      table.push(doc)
      return doc
    },
    update: async ({ collection, id, data }: any) => {
      const table = collection === 'exams' ? exams : events
      const idx = table.findIndex((d) => d.id === id)
      if (idx >= 0) table[idx] = { ...table[idx], ...data }
      return table[idx]
    },
    updateGlobal: async ({ slug, data }: any) => {
      globalCfg = { slug, ...data }
      return globalCfg
    },
    findGlobal: async (_args: any) => globalCfg,
  }
  return { payload, exams, events, provinces, getGlobal: () => globalCfg }
}

describe('seedEvent20260524', () => {
  it('creates 2 exam drafts + 2 events with examRef link', async () => {
    const { payload, exams, events } = makeStore()
    await seedEvent20260524(payload as any)
    expect(exams.length).toBe(2)
    expect(events.length).toBe(2)
    expect(events[0].examRef).toBeTruthy()
    expect(events[1].examRef).toBeTruthy()
    expect(exams[0]._status).toBe('draft')
    expect(exams[1]._status).toBe('draft')
  })

  it('links each event examRef to the corresponding exam id', async () => {
    const { payload, exams, events } = makeStore()
    await seedEvent20260524(payload as any)
    const examIds = exams.map((e) => e.id)
    expect(examIds).toContain(events[0].examRef)
    expect(examIds).toContain(events[1].examRef)
  })

  it('is idempotent (run 2x = 2 records, not 4)', async () => {
    const { payload, exams, events } = makeStore()
    await seedEvent20260524(payload as any)
    await seedEvent20260524(payload as any)
    expect(exams.length).toBe(2)
    expect(events.length).toBe(2)
  })

  it('seeds sidebar config global with 3 groups, first title "Đề thi vào lớp 10"', async () => {
    const { payload, getGlobal } = makeStore()
    await seedEvent20260524(payload as any)
    const cfg = getGlobal()
    expect(cfg).toBeTruthy()
    expect(cfg.groups.length).toBe(3)
    expect(cfg.groups[0].title).toBe('Đề thi vào lớp 10')
    expect(cfg.slug).toBe('kho_de_sidebar_config')
  })

  it('throws if provinces ninh-binh + da-nang not seeded', async () => {
    const { payload } = makeStore()
    // Override find so provinces returns empty
    ;(payload as any).find = async ({ collection }: any) => {
      if (collection === 'provinces') return { docs: [], totalDocs: 0 }
      return { docs: [], totalDocs: 0 }
    }
    await expect(seedEvent20260524(payload as any)).rejects.toThrow(/Provinces/)
  })
})
