import { afterEach, describe, expect, it } from 'bun:test'
import { generateKeyPairSync } from 'node:crypto'
import { rsaDecrypt, rsaEncrypt } from './rsa'

const originalPublicKey = process.env.RSA_PUBLIC_KEY
const originalPrivateKey = process.env.RSA_PRIVATE_KEY

const restoreKeys = () => {
  if (originalPublicKey === undefined) {
    delete process.env.RSA_PUBLIC_KEY
  } else {
    process.env.RSA_PUBLIC_KEY = originalPublicKey
  }

  if (originalPrivateKey === undefined) {
    delete process.env.RSA_PRIVATE_KEY
  } else {
    process.env.RSA_PRIVATE_KEY = originalPrivateKey
  }
}

const setTestKeys = () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })

  process.env.RSA_PUBLIC_KEY = publicKey.replace(/\n/g, '\\n')
  process.env.RSA_PRIVATE_KEY = privateKey.replace(/\n/g, '\\n')
}

afterEach(() => {
  restoreKeys()
})

describe('rsa helpers', () => {
  it('encrypts and decrypts a payload', () => {
    setTestKeys()

    const plainText = 'openproxy-secret'
    const encrypted = rsaEncrypt(plainText)
    const decrypted = rsaDecrypt(encrypted)

    expect(encrypted).not.toBe(plainText)
    expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/)
    expect(decrypted).toBe(plainText)
  })

  it('throws a clear error when the public key is missing', () => {
    delete process.env.RSA_PUBLIC_KEY

    expect(() => rsaEncrypt('secret')).toThrow(
      'RSA_PUBLIC_KEY is not configured'
    )
  })

  it('throws a clear error when the private key is missing', () => {
    setTestKeys()
    delete process.env.RSA_PRIVATE_KEY

    expect(() => rsaDecrypt('encrypted')).toThrow(
      'RSA_PRIVATE_KEY is not configured'
    )
  })
})
