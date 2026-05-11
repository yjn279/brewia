import { ReactNode } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface ScreenContainerProps {
  children: ReactNode
  scroll?: boolean
}

export function ScreenContainer({ children, scroll = true }: ScreenContainerProps) {
  const inner = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent}>{children}</ScrollView>
  ) : (
    <View style={styles.fill}>{children}</View>
  )

  return <SafeAreaView style={styles.fill}>{inner}</SafeAreaView>
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
})
