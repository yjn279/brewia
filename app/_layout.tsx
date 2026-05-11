import { Redirect, Stack } from 'expo-router'
import { View } from 'react-native'
import { useSession } from '@/lib/auth'

export default function RootLayout() {
  // useSession() returns a synthetic session when EXPO_PUBLIC_E2E_USER_ID is set
  // in non-production builds (isE2EBypass() === true), bypassing Supabase OAuth.
  // In that case session is non-null here and the redirect below is skipped.
  const { session, loading } = useSession()

  if (loading) {
    return <View style={{ flex: 1 }} />
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return <Stack />
}
