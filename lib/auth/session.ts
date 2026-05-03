import 'server-only'

import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { sessionsTable, usersTable } from '@/lib/db/schema'

export const SESSION_COOKIE_NAME = 'brewia_session'
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export interface SessionUser {
  id: string
  email: string
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) return null

  const [row] = await db
    .select({
      sessionId: sessionsTable.id,
      expiresAt: sessionsTable.expiresAt,
      userId: usersTable.id,
      email: usersTable.email,
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(eq(sessionsTable.id, sessionId))
    .limit(1)

  if (!row) return null

  if (new Date(row.expiresAt) < new Date()) {
    // Session expired — clean up
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId))
    return null
  }

  return { id: row.userId, email: row.email }
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

  const [session] = await db
    .insert(sessionsTable)
    .values({ userId, expiresAt })
    .returning({ id: sessionsTable.id })

  return session.id
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId))
}

export function buildSessionCookie(sessionId: string): {
  name: string
  value: string
  options: {
    httpOnly: boolean
    path: string
    sameSite: 'lax'
    secure: boolean
    maxAge: number
  }
} {
  return {
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    options: {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_DURATION_MS / 1000,
    },
  }
}
