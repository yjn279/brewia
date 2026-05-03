import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession } from '@/lib/auth/session'
import { clearSessionCookie } from '@/lib/auth/cookie'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'

export const dynamic = 'force-dynamic'

export async function POST() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (sessionId) {
    await deleteSession(sessionId)
  }

  await clearSessionCookie()

  return NextResponse.json({ ok: true })
}
