'use client'
import React, { useState } from 'react'

type Props = {
  doc?: { id?: string; deReady?: boolean; dapAnReady?: boolean }
}

export const EventPublishButtons: React.FC<Props> = ({ doc }) => {
  const [busy, setBusy] = useState<null | 'de' | 'dapan'>(null)
  const [error, setError] = useState<string | null>(null)

  if (!doc?.id) {
    return (
      <div
        style={{
          padding: 12,
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        Lưu event lần đầu để mở khoá nút Publish đề / Publish đáp án.
      </div>
    )
  }

  const handlePublish = async (kind: 'de' | 'dapan') => {
    setBusy(kind)
    setError(null)
    try {
      const res = await fetch(`/api/events/${doc.id}/publish-${kind}`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      window.location.reload()
    } catch (e: any) {
      setError(e?.message || 'Lỗi không xác định')
    } finally {
      setBusy(null)
    }
  }

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
        gap: 8,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14 }}>⚡ Quick publish actions</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => handlePublish('de')}
          disabled={busy !== null || doc.deReady}
          style={{
            padding: '8px 14px',
            background: doc.deReady ? '#d1d5db' : '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: doc.deReady ? 'default' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {busy === 'de' ? '...' : doc.deReady ? '✓ Đề đã publish' : '📤 Publish đề'}
        </button>
        <button
          type="button"
          onClick={() => handlePublish('dapan')}
          disabled={busy !== null || doc.dapAnReady}
          style={{
            padding: '8px 14px',
            background: doc.dapAnReady ? '#d1d5db' : '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: doc.dapAnReady ? 'default' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {busy === 'dapan'
            ? '...'
            : doc.dapAnReady
              ? '✓ Đáp án đã publish'
              : '✅ Publish đáp án'}
        </button>
      </div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>
        Sau khi publish → notify dispatch (log placeholder) + cập nhật slot hero/popup.
      </div>
      {error && (
        <div style={{ fontSize: 13, color: '#dc2626', marginTop: 4 }}>Lỗi: {error}</div>
      )}
    </div>
  )
}

export default EventPublishButtons
