import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const rootDir = resolve(import.meta.dir, '..')
const sourcePath = resolve(rootDir, 'packages/config/src/ai-providers.json')
const outputPath = resolve(rootDir, 'apps/api/generated/ai-providers.json')

const sourceContent = await readFile(sourcePath, 'utf8')
const normalizedJson = `${JSON.stringify(JSON.parse(sourceContent), null, 2)}\n`

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, normalizedJson)

console.log(`Synced ${outputPath}`)