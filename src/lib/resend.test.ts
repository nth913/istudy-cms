import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendMagicLink } from './resend'

// Mock Resend client
vi.mock('resend', () => {
  const mockSend = vi.fn().mockResolvedValue({ id: 'email-123' })
  return {
    Resend: vi.fn(() => ({
      emails: { send: mockSend },
      contacts: { create: vi.fn() },
    })),
  }
})

describe('sendMagicLink', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test-key'
    process.env.NEWSLETTER_FROM_EMAIL = 'test@example.com'
    vi.clearAllMocks()
  })

  it('sends email with branded Vietnamese template', async () => {
    const to = 'user@example.com'
    const verifyUrl = 'https://aistudy.com.vn/verify?token=abc123'

    await sendMagicLink(to, verifyUrl)

    const { Resend } = await import('resend')
    const client = new Resend('test-key')
    expect(client.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringContaining('iStudy'),
        to,
        subject: expect.stringContaining('Xác nhận đăng ký'),
      })
    )
  })

  it('includes confirm text in HTML template', async () => {
    const to = 'user@example.com'
    const verifyUrl = 'https://aistudy.com.vn/verify?token=abc123'

    await sendMagicLink(to, verifyUrl)

    const { Resend } = await import('resend')
    const client = new Resend('test-key')
    const callArgs = (client.emails.send as any).mock.calls[0][0]
    const html = callArgs.html

    expect(html).toContain('Xác nhận đăng ký')
    expect(html).toContain('iStudy')
    expect(html).toContain(verifyUrl)
  })

  it('includes fallback copy-paste URL', async () => {
    const to = 'user@example.com'
    const verifyUrl = 'https://aistudy.com.vn/verify?token=abc123'

    await sendMagicLink(to, verifyUrl)

    const { Resend } = await import('resend')
    const client = new Resend('test-key')
    const callArgs = (client.emails.send as any).mock.calls[0][0]
    const html = callArgs.html

    expect(html).toContain('Hoặc copy link sau vào trình duyệt')
    expect(html).toContain(verifyUrl)
  })

  it('includes 24h expiry note', async () => {
    const to = 'user@example.com'
    const verifyUrl = 'https://aistudy.com.vn/verify?token=abc123'

    await sendMagicLink(to, verifyUrl)

    const { Resend } = await import('resend')
    const client = new Resend('test-key')
    const callArgs = (client.emails.send as any).mock.calls[0][0]
    const html = callArgs.html

    expect(html).toContain('Link có hiệu lực 24 giờ')
  })

  it('uses domain from environment', async () => {
    const to = 'user@example.com'
    const verifyUrl = 'https://aistudy.com.vn/verify?token=abc123'

    await sendMagicLink(to, verifyUrl)

    const { Resend } = await import('resend')
    const client = new Resend('test-key')
    const callArgs = (client.emails.send as any).mock.calls[0][0]
    const html = callArgs.html

    expect(html).toContain('aistudy.com.vn')
  })
})
