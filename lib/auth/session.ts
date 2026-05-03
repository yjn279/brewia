import 'server-only'

import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { sessionsTable } from '@/lib/db/schema'
import { SESSION_DURATION_MS } from '@/lib/auth/constants'

export async function createSession(userId: string): Promise<{ id: string; expiresAt: Date }> {
  const id = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await db.insert(sessionsTable).values({
    id,
    userId,
    expiresAt: expiresAt.toISOString(),
  })

  return { id, expiresAt }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId))
}

export async function getSessionUser(sessionId: string): Promise<{ id: string; email: string } | null> {
  const [row] = await db
    .select({
      userId: sessionsTable.userId,
      expiresAt: sessionsTable.expiresAt,
    })
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .limit(1)

  if (!row) {
    return null
  }

  if (new Date(row.expiresAt) < new Date()) {
    await deleteSession(sessionId)
    return null
  }

  const { usersTable } = await import('@/lib/db/schema')
  const [userRow] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, row.userId))
    .limit(1)

  return userRow ?? null
}
