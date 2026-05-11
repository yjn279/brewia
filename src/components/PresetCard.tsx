import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Preset } from '@/types/domain'

interface PresetCardProps {
  preset: Preset
  onPress?: () => void
}

export function PresetCard({ preset, onPress }: PresetCardProps) {
  const stepCount = preset.steps?.length ?? 0

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {preset.name}
          </Text>
          {preset.description ? (
            <Text style={styles.desc} numberOfLines={1}>
              {preset.description}
            </Text>
          ) : null}
          <Text style={styles.meta}>
            {stepCount} step{stepCount !== 1 ? 's' : ''} · ratio {preset.brewRatio}
          </Text>
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
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  desc: { fontSize: 13, color: '#666', marginTop: 2 },
  meta: { fontSize: 12, color: '#999', marginTop: 4 },
})
