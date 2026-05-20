import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn().mockResolvedValue({}),
  })),
  HeadBucketCommand: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    db: {
      connection: {
        db: {
          admin: () => ({
            ping: vi.fn().mockResolvedValue({ ok: 1 }),
          }),
        },
      },
    },
  }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

describe('GET /api/health', () => {
  beforeEach(() => {
    process.env.S3_BUCKET = 'test-bucket'
    process.env.S3_ENDPOINT = 'https://test.r2.cloudflarestorage.com'
    process.env.S3_ACCESS_KEY_ID = 'test'
    process.env.S3_SECRET_ACCESS_KEY = 'test'
    process.env.S3_REGION = 'auto'
    process.env.NEXT_PUBLIC_VERSION = 'abc1234'
    vi.resetModules()
  })

  it('returns 200 with status ok when mongo and r2 healthy', async () => {
    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.checks.mongo.status).toBe('ok')
    expect(body.checks.r2.status).toBe('ok')
    expect(body.version).toBe('abc1234')
    expect(typeof body.uptime).toBe('number')
  })

  it('returns 200 with status degraded when r2 fails but mongo ok', async () => {
    const { S3Client } = await import('@aws-sdk/client-s3')
    vi.mocked(S3Client).mockImplementationOnce(
      () =>
        ({
          send: vi.fn().mockRejectedValue(new Error('r2 down')),
        }) as never,
    )
    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('degraded')
    expect(body.checks.r2.status).toBe('fail')
  })

  it('returns 503 when mongo ping fails', async () => {
    const payload = await import('payload')
    vi.mocked(payload.getPayload).mockResolvedValueOnce({
      db: {
        connection: {
          db: {
            admin: () => ({
              ping: vi.fn().mockRejectedValue(new Error('mongo down')),
            }),
          },
        },
      },
    } as never)
    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.status).toBe('down')
    expect(body.checks.mongo.status).toBe('fail')
  })
})
