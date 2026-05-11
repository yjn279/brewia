import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ScreenContainer } from '@/components/ScreenContainer'
import { listBeans } from '@/features/beans/api'
import { listBrews } from '@/features/brews/api'
import { listPresets } from '@/features/presets/api'

export default function DashboardScreen() {
  const [beanCount, setBeanCount] = useState<number | null>(null)
  const [brewCount, setBrewCount] = useState<number | null>(null)
  const [presetCount, setPresetCount] = useState<number | null>(null)

  useEffect(() => {
    listBeans()
      .then((data) => setBeanCount(data.length))
      .catch(() => setBeanCount(0))
    listBrews()
      .then((data) => setBrewCount(data.length))
      .catch(() => setBrewCount(0))
    listPresets()
      .then((data) => setPresetCount(data.length))
      .catch(() => setPresetCount(0))
  }, [])

  return (
    <ScreenContainer>
      <Text style={styles.title}>Welcome to Brewia</Text>
      <Text style={styles.subtitle}>Your coffee voyage diary</Text>
      <View style={styles.stats}>
        <StatCard label="Beans" value={beanCount} />
        <StatCard label="Brews" value={brewCount} />
        <StatCard label="Presets" value={presetCount} />
      </View>
    </ScreenContainer>
  )
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value ?? '...'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
})
