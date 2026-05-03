import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { usersTable } from '@/lib/db/schema'
import { authSchema } from '@/lib/auth/schema'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'
import { setSessionCookie } from '@/lib/auth/cookie'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const json = await request.json()
  const parsed = authSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, password } = parsed.data

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email, passwordHash: usersTable.passwordHash })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.passwordHash)

  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const session = await createSession(user.id)
  await setSessionCookie(session.id)

  return NextResponse.json({ id: user.id })
}
