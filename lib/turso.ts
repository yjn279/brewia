import { createClient, type Client } from '@libsql/client'

let client: Client | null = null

function getEnv(name: 'TURSO_DATABASE_URL' | 'TURSO_AUTH_TOKEN'): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is not set`)
  }

  return value
}

export function getTursoClient(): Client {
  if (client) {
    return client
  }

  client = createClient({
    url: getEnv('TURSO_DATABASE_URL'),
    authToken: getEnv('TURSO_AUTH_TOKEN'),
  })

  return client
}

export async function verifyTursoConnection() {
  const result = await getTursoClient().execute('SELECT 1 AS ok')
  const ok = result.rows[0]?.ok
  return ok === 1 || ok === BigInt(1)
}
