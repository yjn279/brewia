import { NextResponse } from 'next/server'
import { loginSchema } from '@/app/auth/schema'
import { authService } from '@/app/auth/service'
import { buildSessionCookie } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const json = await request.json()
  const parsed = loginSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = await authService.login(parsed.data.email, parsed.data.password)

  if (!result) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const cookie = buildSessionCookie(result.sessionId)
  const response = NextResponse.json({ ok: true }, { status: 200 })
  response.cookies.set(cookie.name, cookie.value, cookie.options)
  return response
}
