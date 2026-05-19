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
  const brand = 'iStudy'
  const domain = 'aistudy.com.vn'
  await getClient().emails.send({
    from: `${brand} <${from}>`,
    to,
    subject: 'Xác nhận đăng ký nhận tin từ iStudy',
    html: `
<!doctype html>
<html lang="vi">
<body style="margin:0;padding:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7f9;padding:32px 0">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <tr><td style="padding:32px 40px 16px;background:#DC2626;color:#fff">
          <div style="font-family:'Fredoka','Segoe UI',sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.5px">iStudy</div>
          <div style="font-size:13px;opacity:0.9;margin-top:4px">Better Understanding, Better Learning</div>
        </td></tr>
        <tr><td style="padding:32px 40px">
          <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3">Xác nhận đăng ký nhận tin</h1>
          <p style="margin:0 0 16px;line-height:1.6">Xin chào,</p>
          <p style="margin:0 0 24px;line-height:1.6">Cảm ơn bạn đã đăng ký nhận tin từ <strong>${domain}</strong>. Click nút dưới đây để hoàn tất xác nhận:</p>
          <p style="margin:0 0 24px;text-align:center">
            <a href="${verifyUrl}" style="display:inline-block;background:#DC2626;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px">Xác nhận đăng ký</a>
          </p>
          <p style="margin:0 0 16px;font-size:13px;color:#6b7280;line-height:1.6">Hoặc copy link sau vào trình duyệt:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#6b7280;word-break:break-all;background:#f9fafb;padding:12px;border-radius:6px;border:1px solid #e5e7eb">${verifyUrl}</p>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6">Link có hiệu lực 24 giờ. Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.</p>
        </td></tr>
        <tr><td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;line-height:1.6">
          © 2026 iStudy · ${domain}<br>
          Bạn nhận email này vì đã đăng ký nhận tin tại ${domain}.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
