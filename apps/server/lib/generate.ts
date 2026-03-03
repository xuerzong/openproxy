import { customAlphabet } from 'nanoid'

const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

const alphabet2 = '23456789abcdefghijkmnopqrstuvwxyz'

export const generateOrderId = () => {
  const now = new Date()
  return `${now.toISOString().slice(0, 10).replaceAll('-', '')}${customAlphabet(
    alphabet
  )(12)}`
}

export const generateInviteCode = () => {
  return customAlphabet(alphabet2)(6)
}

export const generateApiKey = (prefix = 'sk-') => {
  return `${prefix}${customAlphabet(alphabet2)(48)}`
}

export const generateDeApiKey = (apiKey: string) => {
  return apiKey
    ? `${apiKey.slice(0, 6)}${'.'.repeat(6)}${apiKey.slice(-4)}`
    : ''
}

export const generateModelSuffix = () => {
  return '-' + customAlphabet(alphabet2)(8)
}

export const generateDBId = (length?: number) => {
  return customAlphabet(alphabet2)(length)
}

export const generateUserName = () => {
  return `用户` + customAlphabet(alphabet2)(8)
}
