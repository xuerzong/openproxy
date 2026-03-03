import { publicEncrypt, privateDecrypt, constants } from 'node:crypto'

const publicKey = process.env.RSA_PUBLIC_KEY!.replace(/\\n/g, '\n')
const privateKey = process.env.RSA_PRIVATE_KEY!.replace(/\\n/g, '\n')

export function rsaEncrypt(data: string) {
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
