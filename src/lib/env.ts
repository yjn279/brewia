import { z } from 'zod'

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  EXPO_PUBLIC_E2E_USER_ID: z.string().min(1).optional(),
})

const _env = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_E2E_USER_ID: process.env.EXPO_PUBLIC_E2E_USER_ID,
})

if (!_env.success) {
  console.warn(
    '[env] Missing or invalid Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  )
}

export const SUPABASE_URL: string =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY: string =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * E2E test user ID injected via EXPO_PUBLIC_E2E_USER_ID.
 * Only available in non-production builds.
 */
export const E2E_USER_ID: string | undefined =
  process.env.EXPO_PUBLIC_E2E_USER_ID

/**
 * Returns true when the E2E session bypass should be activated.
 * Active only when:
 *   - EXPO_PUBLIC_E2E_USER_ID is a non-empty string, AND
 *   - NODE_ENV is NOT 'production'
 *
 * This ensures the bypass is never active in production builds even if the
 * env var were accidentally set.
 */
export function isE2EBypass(): boolean {
  return (
    typeof E2E_USER_ID === 'string' &&
    E2E_USER_ID.length > 0 &&
    process.env.NODE_ENV !== 'production'
  )
}
