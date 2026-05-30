// istudy-cms/src/lib/search-index.ts
import MiniSearch from 'minisearch'
import type { Payload } from 'payload'
import { removeVietnameseDiacritics } from './vietnamese-slugify'
import { formatVN, minutesRead } from './search-helpers'

export type CatId = 'thpt' | 'l10' | 'hsa' | 'blog'

export interface SearchResult {
  id: string
  cat: CatId
  href: string
  title: string
  meta: string[]
}

export interface SearchBuckets {
  thpt: SearchResult[]
  l10: SearchResult[]
  hsa: SearchResult[]
  blog: SearchResult[]
  total: number
}

export const EXAM_TYPE_LABEL: Record<string, string> = {
  'chinh-thuc': 'Đề chính thức',
  'thi-thu': 'Đề thi thử',
  'minh-hoa': 'Đề minh hoạ',
}

export const POST_CAT_LABEL: Record<string, string> = {
  'tu-vung': 'Từ vựng',
  'ngu-phap': 'Ngữ pháp',
  meo: 'Mẹo',
  'tin-tuc': 'Tin tức',
}

export function examToResult(doc: any): SearchResult {
  const cat: CatId = doc.category === 'vao-10' ? 'l10' : 'thpt'
  const meta = [
    EXAM_TYPE_LABEL[doc.examType] || null,
    doc.year ? `Năm ${doc.year}` : null,
    doc.province?.name || doc.school || null,
    doc.dapAnReady ? 'Có đáp án' : null,
  ].filter(Boolean) as string[]
  return { id: String(doc.id), cat, href: `/de-thi-chi-tiet/${doc.slug}`, title: doc.title, meta }
}

export function eventToResult(doc: any): SearchResult {
  const meta = [
    'HSA · ĐGNL',
    formatVN(doc.startAt) ? `Đợt ${formatVN(doc.startAt)}` : null,
    doc.registeredCount ? `${doc.registeredCount} đăng ký` : null,
  ].filter(Boolean) as string[]
  return { id: String(doc.id), cat: 'hsa', href: `/kho-de-thi?event=${doc.slug}`, title: doc.title, meta }
}

export function postToResult(doc: any): SearchResult {
  const meta = [
    POST_CAT_LABEL[doc.category] || null,
    doc.author?.name || null,
    doc.publishedAt ? `${minutesRead(doc.body)} phút đọc` : null,
  ].filter(Boolean) as string[]
  return { id: String(doc.id), cat: 'blog', href: `/bai-viet-chi-tiet/${doc.slug}`, title: doc.title, meta }
}

interface IndexDoc {
  id: string
  cat: CatId
  title: string
  searchText: string
  dto: SearchResult
}

const TTL_MS = 5 * 60 * 1000
const BUILD_LIMIT = 5000
const SEARCH_OPTS = { fuzzy: 0.2, prefix: true, boost: { title: 3, searchText: 1 } } as const

function processTerm(term: string): string | null {
  const t = removeVietnameseDiacritics(term).toLowerCase()
  return t || null
}

function newIndex(): MiniSearch<IndexDoc> {
  return new MiniSearch<IndexDoc>({
    fields: ['title', 'searchText'],
    storeFields: ['cat', 'dto'],
    processTerm,
  })
}

async function loadIndexDocs(payload: Payload): Promise<IndexDoc[]> {
  const [exams, events, posts] = await Promise.all([
    payload.find({ collection: 'exams', where: { _status: { equals: 'published' } }, limit: BUILD_LIMIT, depth: 1 }),
    payload.find({ collection: 'events', where: { _status: { equals: 'published' }, submenu: { in: ['dgnl', 'dgnl-thu'] } }, limit: BUILD_LIMIT, depth: 1 }),
    payload.find({ collection: 'posts', where: { _status: { equals: 'published' } }, limit: BUILD_LIMIT, depth: 1 }),
  ])
  const docs: IndexDoc[] = []
  for (const d of exams.docs as any[]) {
    docs.push({ id: `exam_${d.id}`, cat: d.category === 'vao-10' ? 'l10' : 'thpt', title: d.title ?? '', searchText: d.searchKey ?? '', dto: examToResult(d) })
  }
  for (const d of events.docs as any[]) {
    docs.push({ id: `event_${d.id}`, cat: 'hsa', title: d.title ?? '', searchText: d.searchKeyEvent ?? '', dto: eventToResult(d) })
  }
  for (const d of posts.docs as any[]) {
    docs.push({ id: `post_${d.id}`, cat: 'blog', title: d.title ?? '', searchText: d.searchKeyPost ?? '', dto: postToResult(d) })
  }
  return docs
}

export async function buildSearchIndex(payload: Payload): Promise<MiniSearch<IndexDoc>> {
  const docs = await loadIndexDocs(payload)
  const idx = newIndex()
  idx.addAll(docs)
  state.index = idx
  state.builtAt = Date.now()
  state.dirty = false
  return idx
}

interface IndexState {
  index: MiniSearch<IndexDoc> | null
  builtAt: number
  dirty: boolean
  building: Promise<MiniSearch<IndexDoc>> | null
}

const state: IndexState = { index: null, builtAt: 0, dirty: true, building: null }

export function markSearchDirty(): void {
  state.dirty = true
}

async function getIndex(payload: Payload): Promise<MiniSearch<IndexDoc>> {
  const fresh = state.index && !state.dirty && Date.now() - state.builtAt <= TTL_MS
  if (fresh) return state.index as MiniSearch<IndexDoc>
  if (state.building) return state.building
  state.building = buildSearchIndex(payload).finally(() => {
    state.building = null
  })
  return state.building
}

export async function queryIndex(payload: Payload, q: string, limit: number): Promise<SearchBuckets> {
  const idx = await getIndex(payload)
  const andHits = idx.search(q, { ...SEARCH_OPTS, combineWith: 'AND' as const })
  const orHits = idx.search(q, { ...SEARCH_OPTS, combineWith: 'OR' as const })
  const seen = new Set<string>()
  const buckets: SearchBuckets = { thpt: [], l10: [], hsa: [], blog: [], total: 0 }
  for (const hit of [...andHits, ...orHits]) {
    const id = hit.id as string
    if (seen.has(id)) continue
    seen.add(id)
    const dto = (hit as any).dto as SearchResult
    if (buckets[dto.cat].length < limit) buckets[dto.cat].push(dto)
  }
  buckets.total = buckets.thpt.length + buckets.l10.length + buckets.hsa.length + buckets.blog.length
  return buckets
}
