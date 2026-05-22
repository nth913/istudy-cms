import type { Endpoint } from 'payload'

const FILTER_QUERY_RE = /^\?[a-z]+=[a-z0-9-,]+(&[a-z]+=[a-z0-9-,]+)*$/

async function parseFilterQueryToWhere(filterQuery: string, payload: any): Promise<any | null> {
  if (!FILTER_QUERY_RE.test(filterQuery)) return null
  const sp = new URLSearchParams(filterQuery.slice(1))
  const where: any = { _status: { equals: 'published' } }
  const cat = sp.get('cat') || sp.get('category')
  if (cat) where.category = { equals: cat }
  const year = sp.get('year')
  if (year) where.year = { equals: year }
  const provinceSlug = sp.get('province')
  if (provinceSlug) {
    const provRes = await payload.find({
      collection: 'provinces',
      where: { slug: { equals: provinceSlug } },
      limit: 1,
    })
    if (provRes.docs[0]) where.province = { equals: provRes.docs[0].id }
    else return null
  }
  return where
}

export const examsSidebarFacetsEndpoint: Endpoint = {
  path: '/sidebar-facets',
  method: 'get',
  handler: async (req: any) => {
    const config = (await req.payload
      .findGlobal({ slug: 'kho_de_sidebar_config' })
      .catch(() => null)) as any
    const groups = config?.groups || []

    const result = await Promise.all(
      groups.map(async (g: any) => ({
        title: g.title,
        items: await Promise.all(
          (g.items || []).map(async (it: any) => {
            let count: number
            if (it.countOverride != null) {
              count = it.countOverride
            } else {
              const where = await parseFilterQueryToWhere(it.filterQuery, req.payload)
              if (where == null) {
                count = 0
              } else {
                const res = await req.payload.count({ collection: 'exams', where })
                count = res.totalDocs
              }
            }
            return { label: it.label, filterQuery: it.filterQuery, count }
          }),
        ),
      })),
    )

    return Response.json({ groups: result })
  },
}
