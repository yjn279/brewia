import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession, SESSION_COOKIE_NAME } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (sessionId) {
    await deleteSession(sessionId)
  }

  const response = new NextResponse(null, { status: 204 })
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
  })
  return response
}
