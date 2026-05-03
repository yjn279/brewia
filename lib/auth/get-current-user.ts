import 'server-only'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'

export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) {
    return null
  }

  return getSessionUser(sessionId)
}

/**
 * Use in Route Handlers.
 * Returns [user, null] on success or [null, 401 response] when not authenticated.
 */
export async function requireUser(): Promise<
  [{ id: string; email: string }, null] | [null, NextResponse]
> {
  const user = await getCurrentUser()

  if (!user) {
    return [null, NextResponse.json({ error: 'Unauthorized' }, { status: 401 })]
  }

  return [user, null]
}
