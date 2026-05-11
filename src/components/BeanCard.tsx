import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Bean } from '@/types/domain'
import { COUNTRY_FLAGS } from '@/types/domain'

interface BeanCardProps {
  bean: Bean
  onPress?: () => void
}

export function BeanCard({ bean, onPress }: BeanCardProps) {
  const flag = COUNTRY_FLAGS[bean.country as keyof typeof COUNTRY_FLAGS] ?? ''

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <Text style={styles.flag}>{flag}</Text>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {bean.name}
          </Text>
          <Text style={styles.sub}>
            {bean.roaster} · {bean.roast}
          </Text>
          <Text style={styles.country}>{bean.country}</Text>
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
    gap: 12,
  },
  flag: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sub: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  country: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
})
