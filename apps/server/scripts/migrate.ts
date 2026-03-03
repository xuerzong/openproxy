import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
	throw new Error('DATABASE_URL is required for running migrations')
}

const client = postgres(databaseUrl, { max: 1 })
const db = drizzle(client)

try {
	await migrate(db, { migrationsFolder: './drizzle' })
	console.log('[server] drizzle migration completed')
} finally {
	await client.end({ timeout: 5 })
}
