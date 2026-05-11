import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface RatingFieldProps {
  label: string
  value: number
  onChange: (v: number) => void
  max?: number
  error?: string
}

export function RatingField({ label, value, onChange, max = 5, error }: RatingFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stars}>
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <TouchableOpacity key={n} onPress={() => onChange(n)} style={styles.star}>
            <Text style={[styles.starText, n <= value && styles.starActive]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.valueText}>{value}/{max}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 6 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { padding: 2 },
  starText: { fontSize: 22, color: '#ddd' },
  starActive: { color: '#F4B400' },
  valueText: { fontSize: 14, color: '#666', marginLeft: 8 },
  error: { color: '#e53e3e', fontSize: 12, marginTop: 4 },
})
