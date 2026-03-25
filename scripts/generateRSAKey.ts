import { generateKeyPairSync } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const serverEnvPath = new URL('../apps/server/.env', import.meta.url)
const apiEnvPath = new URL('../apps/api/.env', import.meta.url)

type RsaKeys = {
  publicKey: string
  privateKey: string
}

type EnvFileState = {
  content: string
  hasBothKeys: boolean
  publicKey: string | null
  privateKey: string | null
}

const createKeys = (): RsaKeys => {
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

  return {
    publicKey: publicKey.replace(/\n/g, '\\n'),
    privateKey: privateKey.replace(/\n/g, '\\n'),
  }
}

const readEnvFile = (file: URL): string => {
  try {
    return readFileSync(file, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return ''
    }
    throw error
  }
}

const parseEnvValue = (
  content: string,
  key: 'RSA_PUBLIC_KEY' | 'RSA_PRIVATE_KEY'
) => {
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'))

  if (!match) {
    return null
  }

  const value = match[1].trim()

  if (!value) {
    return null
  }

  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }

  return value
}

const getEnvState = (file: URL): EnvFileState => {
  const content = readEnvFile(file)
  const publicKey = parseEnvValue(content, 'RSA_PUBLIC_KEY')
  const privateKey = parseEnvValue(content, 'RSA_PRIVATE_KEY')

  return {
    content,
    publicKey,
    privateKey,
    hasBothKeys: Boolean(publicKey && privateKey),
  }
}

const formatEnvValue = (value: string, useQuotes: boolean) =>
  useQuotes ? `"${value}"` : value

const upsertEnvVariable = (
  content: string,
  key: 'RSA_PUBLIC_KEY' | 'RSA_PRIVATE_KEY',
  value: string,
  useQuotes: boolean
) => {
  const formattedValue = formatEnvValue(value, useQuotes)
  const pattern = new RegExp(`^${key}=.*$`, 'm')

  if (pattern.test(content)) {
    return content.replace(pattern, `${key}=${formattedValue}`)
  }

  const separator = content && !content.endsWith('\n') ? '\n' : ''
  return `${content}${separator}${key}=${formattedValue}\n`
}

const writeKeysToEnv = (
  file: URL,
  state: EnvFileState,
  keys: RsaKeys,
  useQuotes: boolean
) => {
  let nextContent = state.content
  nextContent = upsertEnvVariable(
    nextContent,
    'RSA_PRIVATE_KEY',
    keys.privateKey,
    useQuotes
  )
  nextContent = upsertEnvVariable(
    nextContent,
    'RSA_PUBLIC_KEY',
    keys.publicKey,
    useQuotes
  )
  writeFileSync(file, nextContent)
}

const serverState = getEnvState(serverEnvPath)
const apiState = getEnvState(apiEnvPath)

if (
  serverState.hasBothKeys &&
  apiState.hasBothKeys &&
  (serverState.publicKey !== apiState.publicKey ||
    serverState.privateKey !== apiState.privateKey)
) {
  throw new Error(
    'apps/server/.env and apps/api/.env already contain different RSA key pairs'
  )
}

const resolvedKeys = serverState.hasBothKeys
  ? {
      publicKey: serverState.publicKey!,
      privateKey: serverState.privateKey!,
    }
  : apiState.hasBothKeys
    ? {
        publicKey: apiState.publicKey!,
        privateKey: apiState.privateKey!,
      }
    : createKeys()

if (serverState.hasBothKeys) {
  console.log('Skipped apps/server/.env because RSA keys already exist')
} else {
  writeKeysToEnv(serverEnvPath, serverState, resolvedKeys, false)
  console.log('Wrote RSA keys to apps/server/.env')
}

if (apiState.hasBothKeys) {
  console.log('Skipped apps/api/.env because RSA keys already exist')
} else {
  writeKeysToEnv(apiEnvPath, apiState, resolvedKeys, true)
  console.log('Wrote RSA keys to apps/api/.env')
}
