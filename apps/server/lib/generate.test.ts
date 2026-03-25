import { describe, expect, it } from 'bun:test'
import {
  generateApiKey,
  generateDBId,
  generateDeApiKey,
  generateInviteCode,
  generateModelSuffix,
  generateOrderId,
  generateUserName,
} from './generate'

const safeAlphabetPattern = /^[23456789abcdefghijkmnopqrstuvwxyz]+$/

describe('generate helpers', () => {
  it('generates an order id with a date prefix and 12 random characters', () => {
    const orderId = generateOrderId()
    const today = new Date().toISOString().slice(0, 10).replaceAll('-', '')

    expect(orderId).toStartWith(today)
    expect(orderId).toHaveLength(20)
    expect(orderId).toMatch(/^\d{8}[0-9A-Za-z]{12}$/)
  })

  it('generates invite codes from the safe alphabet', () => {
    const inviteCode = generateInviteCode()

    expect(inviteCode).toHaveLength(6)
    expect(inviteCode).toMatch(safeAlphabetPattern)
  })

  it('generates api keys with the default prefix', () => {
    const apiKey = generateApiKey()

    expect(apiKey).toStartWith('sk-')
    expect(apiKey).toHaveLength(51)
    expect(apiKey.slice(3)).toMatch(safeAlphabetPattern)
  })

  it('supports a custom api key prefix', () => {
    const apiKey = generateApiKey('pk-')

    expect(apiKey).toStartWith('pk-')
    expect(apiKey).toHaveLength(51)
  })

  it('masks api keys for display', () => {
    expect(generateDeApiKey('sk-1234567890abcdefghijklmnop')).toBe(
      'sk-123......mnop'
    )
    expect(generateDeApiKey('')).toBe('')
  })

  it('generates model suffixes with a leading dash', () => {
    const suffix = generateModelSuffix()

    expect(suffix).toHaveLength(9)
    expect(suffix).toMatch(/^-[23456789abcdefghijkmnopqrstuvwxyz]{8}$/)
  })

  it('generates database ids with the requested length', () => {
    const id = generateDBId(10)

    expect(id).toHaveLength(10)
    expect(id).toMatch(safeAlphabetPattern)
  })

  it('generates user names with the expected prefix', () => {
    const userName = generateUserName()

    expect(userName).toStartWith('用户')
    expect(userName.slice(2)).toHaveLength(8)
    expect(userName.slice(2)).toMatch(safeAlphabetPattern)
  })
})
