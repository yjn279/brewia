import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const token = process.env.TURSO_AUTH_TOKEN

  if (!url || !token) {
    const missing = [
      !url && 'TURSO_DATABASE_URL',
      !token && 'TURSO_AUTH_TOKEN',
    ]
      .filter(Boolean)
      .join(', ')
    console.warn(
      `[db-migrate] skipping migrations: missing env vars: ${missing}`
    )
    process.exit(0)
  }

  const client = createClient({ url, authToken: token })
  const db = drizzle(client)

  try {
    console.log('[db-migrate] running migrations...')
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('[db-migrate] migrations complete.')
  } catch (err) {
    console.error('[db-migrate] migration failed:', err)
    process.exit(1)
  } finally {
    client.close()
  }

  process.exit(0)
}

main()
