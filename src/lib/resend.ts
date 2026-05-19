import { Resend } from 'resend'

let _client: Resend | null = null

function getClient(): Resend {
  if (_client) return _client
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY not set')
  _client = new Resend(key)
  return _client
}

export async function sendMagicLink(to: string, verifyUrl: string): Promise<void> {
  const from = process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@aistudy.com.vn'
  await getClient().emails.send({
    from: `iStudy <${from}>`,
    to,
    subject: 'Xác nhận đăng ký nhận tin từ iStudy',
    html: `
<p>Xin chào,</p>
<p>Click vào link dưới đây để xác nhận đăng ký nhận tin từ aistudy.com.vn:</p>
<p><a href="${verifyUrl}">Xác nhận đăng ký</a></p>
<p>Link có hiệu lực 24 giờ. Nếu bạn không yêu cầu, có thể bỏ qua email này.</p>
`,
  })
}

export async function addContactToAudience(email: string): Promise<string | null> {
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!audienceId) {
    console.warn('[resend] RESEND_AUDIENCE_ID not set — skip audience sync')
    return null
  }
  try {
    const result = await getClient().contacts.create({ email, audienceId, unsubscribed: false })
    return result.data?.id || null
  } catch (err) {
    console.error('[resend] addContactToAudience failed', err)
    return null
  }
}
