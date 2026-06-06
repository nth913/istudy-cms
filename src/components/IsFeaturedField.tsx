'use client'
import * as React from 'react'
import { useField } from '@payloadcms/ui'

export const IsFeaturedField: React.FC = () => {
  const { value, setValue } = useField<boolean>({ path: 'isFeatured' })
  const checked = !!value

  return (
    <div
      onClick={() => setValue(!checked)}
      style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 6,
        border: checked ? '2px solid #f59e0b' : '2px solid #d1d5db',
        background: checked ? '#fef3c7' : '#ffffff',
        marginBottom: 16,
        userSelect: 'none',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => setValue(!checked)}
        onClick={(e) => e.stopPropagation()}
        style={{ marginTop: 3, width: 16, height: 16, accentColor: '#f59e0b', cursor: 'pointer' }}
      />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>⭐</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: checked ? '#92400e' : '#374151' }}>
            Bài viết nổi bật
          </span>
        </div>
        <div style={{ fontSize: 12, color: checked ? '#b45309' : '#6b7280', marginTop: 2 }}>
          Bài sẽ hiển thị trong mục nổi bật trên trang chủ
        </div>
      </div>
    </div>
  )
}

export default IsFeaturedField
