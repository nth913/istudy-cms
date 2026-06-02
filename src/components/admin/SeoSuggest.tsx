'use client'
import React, { useState } from 'react'
import { useAllFormFields } from '@payloadcms/ui'
import { extractPlainText } from '../../lib/seo/analyze'

// ── Helpers ────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  if (typeof v === 'string') return v
  return ''
}

interface Suggestion {
  title: string
  description: string
  ogTitle: string
  focusKeyword: string
}

// ── Component ──────────────────────────────────────────────────────────────

export const SeoSuggest: React.FC = () => {
  const [fields, dispatch] = useAllFormFields()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const title = str(fields?.['title']?.value)
  const excerpt = str(fields?.['excerpt']?.value)
  const body = fields?.['body']?.value
  const collection = str(fields?.['collection']?.value)

  const handleSuggest = async () => {
    setBusy(true)
    setError(null)
    setSuggestion(null)
    try {
      const bodyText = extractPlainText(body)
      const res = await fetch('/api/seo/suggest', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, excerpt, bodyText, collection: collection || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`)
      }
      setSuggestion(json as Suggestion)
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || 'Lỗi không xác định'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  const applyField = (path: string, value: string) => {
    try {
      dispatch({ type: 'UPDATE', path, value } as never)
    } catch {
      // Fallback: copy to clipboard if dispatch fails
      void navigator.clipboard?.writeText(value)
    }
  }

  const copyField = async (value: string, key: string) => {
    try {
      await navigator.clipboard?.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div
      style={{
        padding: 16,
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: 8,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Heading + button row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>✨ AI gợi ý SEO</div>
        <button
          type="button"
          disabled={busy}
          onClick={handleSuggest}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 6,
            border: 'none',
            background: busy ? '#93c5fd' : '#3b82f6',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {busy ? 'Đang gợi ý…' : '✨ Gợi ý SEO bằng AI'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '8px 12px',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 6,
            color: '#dc2626',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Suggestions */}
      {suggestion && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
            Kết quả gợi ý — nhấn &quot;Áp dụng&quot; để điền vào form:
          </div>
          {(
            [
              { key: 'title', label: 'SEO Title', path: 'seo.title', value: suggestion.title },
              { key: 'description', label: 'Meta Description', path: 'seo.description', value: suggestion.description },
              { key: 'ogTitle', label: 'OG Title', path: 'seo.ogTitle', value: suggestion.ogTitle },
              { key: 'focusKeyword', label: 'Focus Keyword', path: 'seo.focusKeyword', value: suggestion.focusKeyword },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              style={{
                padding: '10px 12px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3, fontWeight: 600 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13, color: '#111827', wordBreak: 'break-word' }}>
                  {item.value}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => applyField(item.path, item.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 5,
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Áp dụng
                </button>
                <button
                  type="button"
                  onClick={() => void copyField(item.value, item.key)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 5,
                    border: '1px solid #d1d5db',
                    background: copied === item.key ? '#f3f4f6' : '#fff',
                    color: '#374151',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {copied === item.key ? 'Đã copy' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SeoSuggest
