import { describe, it, expect } from 'vitest'
import { sha256Hex } from './checksum'

describe('sha256Hex', () => {
  it('hashes known string "abc"', () => {
    expect(sha256Hex(Buffer.from('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('hashes empty buffer', () => {
    expect(sha256Hex(Buffer.alloc(0))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
  })

  it('produces consistent 64-char hex for 1MB random buffer', () => {
    const buf = Buffer.alloc(1024 * 1024)
    for (let i = 0; i < buf.length; i++) buf[i] = i % 256
    const h1 = sha256Hex(buf)
    const h2 = sha256Hex(buf)
    expect(h1).toHaveLength(64)
    expect(h1).toBe(h2)
  })
})
