import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AIProvider } from '@openproxy/config/ai-providers'

/**
 * Seed-time AI provider registry loader.
 *
 * Source file: `packages/config/src/ai-providers.json`
 */

const providerRegistryCandidates = [
  resolve(process.cwd(), 'packages/config/src/ai-providers.json'),
  resolve(process.cwd(), '../../packages/config/src/ai-providers.json'),
  new URL('../../../packages/config/src/ai-providers.json', import.meta.url)
    .pathname,
]

const providerRegistryFile = providerRegistryCandidates.find((candidate) =>
  existsSync(candidate)
)

if (!providerRegistryFile) {
  throw new Error(
    'Cannot find packages/config/src/ai-providers.json for seeding'
  )
}

export const AI_PROVIDERS = JSON.parse(
  readFileSync(providerRegistryFile, 'utf8')
) as readonly AIProvider[]
