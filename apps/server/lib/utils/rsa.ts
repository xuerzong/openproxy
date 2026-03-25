import { publicEncrypt, privateDecrypt, constants } from 'node:crypto'

const getEnvKey = (name: 'RSA_PUBLIC_KEY' | 'RSA_PRIVATE_KEY') => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is not configured`)
  }

  return value.replace(/\\n/g, '\n')
}

export function rsaEncrypt(data: string) {
  const publicKey = getEnvKey('RSA_PUBLIC_KEY')
  const buffer = Buffer.from(data, 'utf8') as unknown as Uint8Array
  const encrypted = publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer
  )
  return encrypted.toString('base64')
}

export function rsaDecrypt(encryptedData: string) {
  const privateKey = getEnvKey('RSA_PRIVATE_KEY')
  const buffer = Buffer.from(encryptedData, 'base64') as unknown as Uint8Array
  const decrypted = privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer
  )
  return decrypted.toString('utf8')
}
