import { NextResponse } from 'next/server'
import { signupSchema } from '@/app/auth/schema'
import { authService } from '@/app/auth/service'
import { buildSessionCookie } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const json = await request.json()
  const parsed = signupSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const { sessionId } = await authService.signup(parsed.data.email, parsed.data.password)
    const cookie = buildSessionCookie(sessionId)

    const response = NextResponse.json({ ok: true }, { status: 201 })
    response.cookies.set(cookie.name, cookie.value, cookie.options)
    return response
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'EMAIL_EXISTS') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
    throw err
  }
}
