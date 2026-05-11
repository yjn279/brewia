import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Brew } from '@/types/domain'
import { format } from 'date-fns'

interface BrewCardProps {
  brew: Brew
  beanName?: string
  onPress?: () => void
}

export function BrewCard({ brew, beanName, onPress }: BrewCardProps) {
  const date = brew.created ? format(new Date(brew.created), 'MMM d, yyyy') : ''

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.bean} numberOfLines={1}>
            {beanName ?? 'Unknown Bean'}
          </Text>
          <Text style={styles.sub}>
            {brew.waterWeight}ml · {brew.waterTemp}°C
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View style={styles.score}>
          <Text style={styles.scoreValue}>{brew.overall}</Text>
          <Text style={styles.scoreLabel}>overall</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: { flex: 1 },
  bean: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  date: { fontSize: 12, color: '#999', marginTop: 2 },
  score: { alignItems: 'center', minWidth: 48 },
  scoreValue: { fontSize: 24, fontWeight: 'bold', color: '#4285F4' },
  scoreLabel: { fontSize: 11, color: '#999' },
})
