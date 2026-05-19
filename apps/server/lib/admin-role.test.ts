import { describe, expect, it } from 'bun:test'
import { isConfiguredAdminEmail } from './admin-role'

describe('isConfiguredAdminEmail', () => {
  it('matches configured emails case-insensitively', () => {
    expect(
      isConfiguredAdminEmail('Admin@Example.com', 'owner@example.com,admin@example.com')
    ).toBe(true)
  })

  it('ignores surrounding whitespace in configuration and input', () => {
    expect(
      isConfiguredAdminEmail('  admin@example.com  ', ' owner@example.com , admin@example.com ')
    ).toBe(true)
  })

  it('returns false when no configured email matches', () => {
    expect(
      isConfiguredAdminEmail('user@example.com', 'owner@example.com,admin@example.com')
    ).toBe(false)
  })

  it('returns false when configuration is empty', () => {
    expect(isConfiguredAdminEmail('admin@example.com', '')).toBe(false)
  })
})