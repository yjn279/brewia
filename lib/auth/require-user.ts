import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string | null
}

/**
 * Server Component / Server Action 用。
 * セッションが存在しない場合は redirect('/login') を発行する。
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
    // redirect() throws in Next.js; this satisfies TypeScript in test environments
    return undefined as never
  }
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name ?? null,
  }
}

/**
 * Route Handler 用。
 * セッションが存在しない場合は null を返す（redirect しない）。
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name ?? null,
  }
}
