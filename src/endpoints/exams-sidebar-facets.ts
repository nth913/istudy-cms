import type { Endpoint } from 'payload'

// FE-facing sidebar labels — intentionally short for the kho-de-thi sidebar.
// (Collection option labels in collections/Exams.ts are longer, e.g. "THPT Quốc gia".)
// NOTE: only categories listed here render in the sidebar — add new exam categories here too.
const CATEGORY_LABELS: Record<string, string> = {
  'vao-10': 'Vào lớp 10',
  'vao-dai-hoc': 'Thi THPT',
}

const CATEGORY_ORDER = ['vao-10', 'vao-dai-hoc']

export const examsSidebarFacetsEndpoint: Endpoint = {
  path: '/sidebar-facets',
  method: 'get',
  handler: async (req: any) => {
    // Step 1: fetch all exams (no _status filter — matches /api/search-exams population)
    const all = await req.payload.find({
      collection: 'exams',
      pagination: false,
      depth: 0,
      select: { category: true, year: true, province: true },
    })

    // Step 2: in-memory aggregation
    const categoryCounts = new Map<string, number>()
    const yearCounts = new Map<string, number>()
    const provinceCounts = new Map<string, number>()

    for (const doc of all.docs as any[]) {
      if (doc.category) {
        categoryCounts.set(doc.category, (categoryCounts.get(doc.category) ?? 0) + 1)
      }
      if (doc.year) {
        yearCounts.set(String(doc.year), (yearCounts.get(String(doc.year)) ?? 0) + 1)
      }
      if (doc.province != null) {
        const pid = typeof doc.province === 'string' ? doc.province : String((doc.province as any).id ?? '')
        if (pid) {
          provinceCounts.set(pid, (provinceCounts.get(pid) ?? 0) + 1)
        }
      }
    }

    // Step 3: resolve province names/slugs
    const provinceIds = [...provinceCounts.keys()]
    const provinceById = new Map<string, { name: string; slug: string }>()
    if (provinceIds.length > 0) {
      const provRes = await req.payload.find({
        collection: 'provinces',
        where: { id: { in: provinceIds } },
        pagination: false,
        depth: 0,
      })
      for (const p of provRes.docs as any[]) {
        provinceById.set(String(p.id), { name: p.name, slug: p.slug })
      }
    }

    // Step 4: build groups
    const groups: Array<{ title: string; items: Array<{ label: string; filterQuery: string; count: number }> }> = []

    // --- Phân loại (categories) ---
    const catItems = CATEGORY_ORDER
      .filter((cat) => (categoryCounts.get(cat) ?? 0) > 0)
      .map((cat) => ({
        label: CATEGORY_LABELS[cat] ?? cat,
        filterQuery: `?cat=${cat}`,
        count: categoryCounts.get(cat)!,
      }))
    if (catItems.length > 0) {
      groups.push({ title: 'Phân loại', items: catItems })
    }

    // --- Tỉnh / Thành phố (provinces) ---
    const provItems = [...provinceCounts.entries()]
      .filter(([id]) => provinceById.has(id))
      .map(([id, count]) => {
        const prov = provinceById.get(id)!
        return { label: prov.name, filterQuery: `?province=${prov.slug}`, count }
      })
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.label.localeCompare(b.label)
      })
    if (provItems.length > 0) {
      groups.push({ title: 'Tỉnh / Thành phố', items: provItems })
    }

    // --- Năm thi (years) ---
    const yearItems = [...yearCounts.entries()]
      .map(([year, count]) => ({
        label: `Năm ${year}`,
        filterQuery: `?year=${year}`,
        count,
      }))
      .sort((a, b) => Number(b.filterQuery.slice(6)) - Number(a.filterQuery.slice(6)))
    if (yearItems.length > 0) {
      groups.push({ title: 'Năm thi', items: yearItems })
    }

    return Response.json({ groups })
  },
}
