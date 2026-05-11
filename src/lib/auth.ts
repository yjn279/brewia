import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { E2E_USER_ID, isE2EBypass } from './env'

WebBrowser.maybeCompleteAuthSession()

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = Linking.createURL('auth/callback')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  })

  if (error || !data.url) {
    throw error ?? new Error('No OAuth URL returned')
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

  if (result.type === 'success' && result.url) {
    const url = result.url
    // Parse access_token and refresh_token from the fragment or query params
    const parsed = new URL(url)
    const params =
      parsed.hash
        ? new URLSearchParams(parsed.hash.slice(1))
        : parsed.searchParams

    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token })
    }
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export interface SessionState {
  session: Session | null
  loading: boolean
}

/**
 * Builds a synthetic Session for E2E test mode.
 * Only called when isE2EBypass() is true (non-production + E2E_USER_ID set).
 */
function buildSyntheticSession(userId: string): Session {
  const now = new Date().toISOString()
  return {
    access_token: 'e2e',
    refresh_token: 'e2e',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: userId,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: now,
    },
  } as Session
}

export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // E2E bypass: synthesize a session without touching Supabase auth.
    // This is active only in non-production builds when EXPO_PUBLIC_E2E_USER_ID is set.
    if (isE2EBypass() && E2E_USER_ID) {
      setSession(buildSyntheticSession(E2E_USER_ID))
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      },
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}
