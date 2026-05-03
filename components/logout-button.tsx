'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary"
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  )
}
