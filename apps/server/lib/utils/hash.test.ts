import { describe, expect, it } from 'bun:test'
import { hash } from './hash'

describe('hash', () => {
  it('returns the known SHA-256 digest for a string', async () => {
    await expect(hash('hello world')).resolves.toBe(
      'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'
    )
  })

  it('is deterministic for the same input', async () => {
    const [first, second] = await Promise.all([
      hash('openproxy'),
      hash('openproxy'),
    ])

    expect(first).toBe(second)
    expect(first).toHaveLength(64)
  })
})
