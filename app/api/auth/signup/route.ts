import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { usersTable } from '@/lib/db/schema'
import { authSchema } from '@/lib/auth/schema'
import { hashPassword } from '@/lib/auth/password'
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

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1)

  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)

  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash })
    .returning({ id: usersTable.id, email: usersTable.email })

  const session = await createSession(user.id)
  await setSessionCookie(session.id)

  return NextResponse.json({ id: user.id }, { status: 201 })
}
