'use client'
import React from 'react'

type Props = {
  doc?: { deReady?: boolean; dapAnReady?: boolean }
}

export const EventStateBadge: React.FC<Props> = ({ doc }) => {
  let state: 'pre' | 'de' | 'dap-an'
  let label: string
  let color: string

  if (doc?.dapAnReady) {
    state = 'dap-an'
    label = '✅ Đáp án đã có'
    color = '#10b981'
  } else if (doc?.deReady) {
    state = 'de'
    label = '🎉 Đề đã lên'
    color = '#3b82f6'
  } else {
    state = 'pre'
    label = '⏳ Chờ đề'
    color = '#9ca3af'
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Trạng thái</div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: color,
          color: '#fff',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>state={state}</div>
    </div>
  )
}

export default EventStateBadge
