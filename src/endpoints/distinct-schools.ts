import type { Endpoint, PayloadRequest } from 'payload'

export const distinctSchoolsEndpoint: Endpoint = {
  path: '/distinct-schools',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const url = new URL(req.url || '', 'http://localhost')
    const q = url.searchParams.get('q') ?? ''
    const limit = Math.min(20, Number(url.searchParams.get('limit')) || 10)

    const docs = await req.payload.find({
      collection: 'exams',
      where: {
        _status: { equals: 'published' },
        school: { like: q },
      },
      limit: limit * 5,
      depth: 0,
    })

    const seen = new Set<string>()
    const schools: string[] = []
    for (const d of docs.docs as any[]) {
      const s = d.school as string | undefined
      if (s && !seen.has(s)) {
        seen.add(s)
        schools.push(s)
        if (schools.length >= limit) break
      }
    }

    return Response.json({ schools })
  },
}
