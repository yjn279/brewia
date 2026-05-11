import { Redirect, Stack } from 'expo-router'
import { View } from 'react-native'
import { useSession } from '@/lib/auth'

export default function RootLayout() {
  const { session, loading } = useSession()

  if (loading) {
    return <View style={{ flex: 1 }} />
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return <Stack />
}
