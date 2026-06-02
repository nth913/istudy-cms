'use client'
import React from 'react'
import { useAllFormFields } from '@payloadcms/ui'
import { extractPlainText, lengthScore, onPageChecks } from '../../lib/seo/analyze'
import type { CheckStatus, LenStatus } from '../../lib/seo/analyze'

// ── Helpers ────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  if (typeof v === 'string') return v
  return ''
}

const lenColor: Record<LenStatus, string> = {
  ok: '#10b981',
  warn: '#d29922',
  bad: '#dc2626',
}

const checkIcon: Record<CheckStatus, string> = {
  pass: '✓',
  warn: '!',
  fail: '✗',
}

const checkColor: Record<CheckStatus, string> = {
  pass: '#10b981',
  warn: '#d29922',
  fail: '#dc2626',
}

// ── Component ──────────────────────────────────────────────────────────────

export const SeoPanel: React.FC = () => {
  // useAllFormFields returns [FormState, Dispatch] tuple
  const [formState] = useAllFormFields()

  // Read sibling form values — every field may be undefined
  const title        = str(formState['title']?.value)
  const slug         = str(formState['slug']?.value)
  const excerpt      = str(formState['excerpt']?.value)
  const body         = formState['body']?.value
  const seoTitle     = str(formState['seo.title']?.value)
  const seoDesc      = str(formState['seo.description']?.value)
  const focusKeyword = str(formState['seo.focusKeyword']?.value)

  // Effective values for SERP
  const effTitle = seoTitle || title || ''
  const effDesc  = seoDesc  || excerpt || ''
  const bodyText = extractPlainText(body)

  // Scoring
  const titleLen = lengthScore(effTitle, 'title')
  const descLen  = lengthScore(effDesc, 'description')
  const checks   = onPageChecks({
    title: effTitle,
    description: effDesc,
    slug,
    bodyText,
    focusKeyword,
  })

  const displaySlug = slug ? `aistudy.com.vn/${slug}` : 'aistudy.com.vn/...'

  return (
    <div
      style={{
        padding: 16,
        background: '#fafafa',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Heading */}
      <div style={{ fontWeight: 600, fontSize: 14 }}>🔍 SEO — xem trước &amp; kiểm tra</div>

      {/* ── 1. SERP Preview ───────────────────────────────────────────── */}
      <div
        style={{
          padding: 12,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          maxWidth: 600,
        }}
      >
        {/* Title */}
        <div
          style={{
            color: '#1a0dab',
            fontSize: 18,
            fontWeight: 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3,
            marginBottom: 2,
          }}
        >
          {effTitle || <span style={{ color: '#9ca3af' }}>(chưa có tiêu đề)</span>}
        </div>

        {/* URL */}
        <div
          style={{
            color: '#006621',
            fontSize: 13,
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {displaySlug}
        </div>

        {/* Description */}
        <div
          style={{
            color: '#545454',
            fontSize: 13,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {effDesc || <span style={{ color: '#9ca3af' }}>(chưa có mô tả)</span>}
        </div>
      </div>

      {/* ── 2. Char-count bars ────────────────────────────────────────── */}
      <div
        style={{
          padding: 12,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
          Độ dài ký tự
        </div>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span style={{ minWidth: 90, color: '#6b7280' }}>Tiêu đề SEO</span>
          <span style={{ minWidth: 28, textAlign: 'right', color: '#374151' }}>{titleLen.len}</span>
          <span
            style={{
              padding: '1px 8px',
              borderRadius: 999,
              background: lenColor[titleLen.status],
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {titleLen.status === 'ok' ? 'Tốt' : titleLen.status === 'warn' ? 'Ngắn' : 'Quá dài / rỗng'}
          </span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>30–70 ký tự</span>
        </div>

        {/* Description row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span style={{ minWidth: 90, color: '#6b7280' }}>Mô tả SEO</span>
          <span style={{ minWidth: 28, textAlign: 'right', color: '#374151' }}>{descLen.len}</span>
          <span
            style={{
              padding: '1px 8px',
              borderRadius: 999,
              background: lenColor[descLen.status],
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {descLen.status === 'ok' ? 'Tốt' : descLen.status === 'warn' ? 'Ngắn' : 'Quá dài / rỗng'}
          </span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>80–200 ký tự</span>
        </div>
      </div>

      {/* ── 3. On-page checks ────────────────────────────────────────── */}
      <div
        style={{
          padding: 12,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
          Kiểm tra on-page
        </div>

        {checks.map((check) => (
          <div key={check.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
            {/* Icon */}
            <span
              style={{
                fontWeight: 700,
                color: checkColor[check.status],
                minWidth: 16,
                lineHeight: 1.4,
              }}
            >
              {checkIcon[check.status]}
            </span>

            {/* Label + hint */}
            <div style={{ flex: 1 }}>
              <span style={{ color: '#374151' }}>{check.label}</span>
              {check.hint && (
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{check.hint}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SeoPanel
