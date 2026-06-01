'use client'
import * as React from 'react'
import { useField } from '@payloadcms/ui'
import { vietnameseSlugify } from '../lib/vietnamese-slugify'

type TagOpt = { id: string; name: string }

export const TopicsField: React.FC<{ path: string; field?: any }> = ({ path, field }) => {
  const { value, setValue } = useField<string[]>({ path })
  const ids = Array.isArray(value) ? value : []
  const [labels, setLabels] = React.useState<Record<string, string>>({})
  const [q, setQ] = React.useState('')
  const [opts, setOpts] = React.useState<TagOpt[]>([])
  const [hi, setHi] = React.useState(0)

  const api = (p: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/api${p}`

  // Resolve labels for current ids on mount / when ids change
  React.useEffect(() => {
    const missing = ids.filter((id) => !labels[id])
    if (!missing.length) return
    const qs = missing.map((id) => `where[id][in][]=${encodeURIComponent(id)}`).join('&')
    fetch(api(`/tags?${qs}&limit=50&depth=0`), { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const next: Record<string, string> = {}
        for (const t of d?.docs ?? []) next[String(t.id)] = t.name
        setLabels((prev) => ({ ...prev, ...next }))
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')])

  // Autocomplete search as you type (debounced 200 ms)
  React.useEffect(() => {
    if (!q.trim()) {
      setOpts([])
      return
    }
    const ac = new AbortController()
    const t = setTimeout(() => {
      fetch(
        api(
          `/tags?where[name][like]=${encodeURIComponent(q)}&sort=-popularScore&limit=8&depth=0`,
        ),
        { credentials: 'include', signal: ac.signal },
      )
        .then((r) => r.json())
        .then((d) => {
          setOpts((d?.docs ?? []).map((tag: any) => ({ id: String(tag.id), name: tag.name })))
          setHi(0)
        })
        .catch(() => {})
    }, 200)
    return () => {
      ac.abort()
      clearTimeout(t)
    }
  }, [q])

  const add = (id: string, name: string) => {
    if (!ids.includes(id)) setValue([...ids, id])
    setLabels((p) => ({ ...p, [id]: name }))
    setQ('')
    setOpts([])
  }

  const remove = (id: string) => setValue(ids.filter((x) => x !== id))

  const createNew = async (name: string) => {
    const slug = vietnameseSlugify(name)
    if (!slug) {
      setQ('')
      setOpts([])
      return
    }
    // Check for existing tag with same slug (diacritic-insensitive dedup per spec D2)
    const checkRes = await fetch(
      api(`/tags?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`),
      { credentials: 'include' },
    ).catch((err) => { console.warn('[TopicsField] tag lookup failed', err); return null })
    if (checkRes?.ok) {
      const checkData = await checkRes.json().catch(() => null)
      const existing = checkData?.docs?.[0]
      if (existing?.id) {
        add(String(existing.id), existing.name ?? name)
        return
      }
    }
    // No existing tag — create new
    const res = await fetch(api('/tags'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    }).catch((err) => { console.warn('[TopicsField] tag create failed', err); return null })
    if (!res) return
    if (!res.ok) {
      console.warn('[TopicsField] POST /api/tags returned', res.status)
      return
    }
    const d = await res.json().catch(() => null)
    const doc = d?.doc ?? d
    if (doc?.id) add(String(doc.id), doc.name ?? name)
  }

  const onKeyDown = async (e: React.KeyboardEvent) => {
    if ((e.key === 'Tab' || e.key === 'Enter') && q.trim()) {
      e.preventDefault()
      if (opts[hi]) {
        add(opts[hi].id, opts[hi].name)
      } else {
        await createNew(q.trim())
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHi((h) => Math.min(h + 1, opts.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHi((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Backspace' && !q && ids.length) {
      remove(ids[ids.length - 1])
    }
  }

  return (
    <div className="field-type" style={{ marginBottom: 20 }}>
      <label className="field-label">
        {(field?.admin?.description as string | undefined) ?? 'Chủ đề / Tag'}
      </label>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 4,
          padding: 6,
        }}
      >
        {ids.map((id) => (
          <span
            key={id}
            style={{
              background: 'var(--theme-elevation-100)',
              borderRadius: 12,
              padding: '2px 8px',
              display: 'inline-flex',
              gap: 6,
            }}
          >
            {labels[id] ?? id}
            <button
              type="button"
              aria-label="remove"
              onClick={() => remove(id)}
              style={{ border: 0, background: 'none', cursor: 'pointer' }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Gõ để tìm / tạo tag, Tab để chọn"
          style={{
            flex: 1,
            minWidth: 160,
            border: 0,
            outline: 'none',
            background: 'transparent',
          }}
        />
      </div>
      {opts.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: '4px 0 0',
            padding: 4,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 4,
          }}
        >
          {opts.map((o, i) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseEnter={() => setHi(i)}
                onClick={() => add(o.id, o.name)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 0,
                  background:
                    i === hi ? 'var(--theme-elevation-100)' : 'transparent',
                  padding: '4px 8px',
                  cursor: 'pointer',
                }}
              >
                {o.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default TopicsField
