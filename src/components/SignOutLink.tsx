/**
 * Custom logout link injected into the Payload admin nav.
 *
 * Payload's built-in `/admin/logout` view is meant for inactivity timeouts and
 * doesn't reliably clear the cookie when reached via direct URL. We side-step
 * that by linking to our own `/sign-out` route (src/app/sign-out/route.ts)
 * which expires the cookie + redirects to `/admin/login`.
 *
 * Rendered via `admin.components.afterNavLinks` in payload.config.ts.
 */
import React from 'react'

export const SignOutLink: React.FC = () => {
  return (
    <a
      href="/sign-out"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        marginTop: 12,
        color: 'var(--theme-elevation-800, #ef4444)',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: 13,
        borderTop: '1px solid var(--theme-elevation-100, #e5e7eb)',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16 }}>↪</span>
      Đăng xuất
    </a>
  )
}

export default SignOutLink
