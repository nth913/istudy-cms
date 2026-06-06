'use client'
import * as React from 'react'
import { useFormFields } from '@payloadcms/ui'

export const HeroTiltPreview: React.FC = () => {
  const tiltAngle = useFormFields(([fields]) => (fields.tiltAngle?.value as number) ?? 1.2)

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>
        Preview — độ nghiêng
      </div>
      <div
        style={{
          display: 'inline-block',
          transform: `rotate(${tiltAngle ?? 1.2}deg)`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s',
        }}
      >
        <div
          style={{
            maxWidth: 200,
            background: '#ffffff',
            border: '2px solid #374151',
            borderRadius: 10,
            padding: '16px 20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>
            ĐẾM NGƯỢC
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
            42
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
            ngày còn lại
          </div>
          <div
            style={{
              marginTop: 10,
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
            }}
          />
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
        Góc hiện tại: {(tiltAngle ?? 1.2).toFixed(1)}°
      </div>
    </div>
  )
}

export default HeroTiltPreview
