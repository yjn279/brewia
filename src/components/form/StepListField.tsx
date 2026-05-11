import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyAppend = (value: any) => void
type AnyRemove = (index: number) => void

interface StepListFieldProps {
  fields: { id: string }[]
  append: AnyAppend
  remove: AnyRemove
  getValue: (index: number, field: 'time' | 'water') => string
  setValue: (index: number, field: 'time' | 'water', value: string) => void
  error?: string
}

export function StepListField({
  fields,
  append,
  remove,
  getValue,
  setValue,
  error,
}: StepListFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Steps</Text>
      {fields.map((field, index) => (
        <View key={field.id} style={styles.stepRow}>
          <Text style={styles.stepNum}>{index + 1}</Text>
          <TextInput
            style={styles.stepInput}
            placeholder="Time (s)"
            keyboardType="numeric"
            value={getValue(index, 'time')}
            onChangeText={(v) => setValue(index, 'time', v)}
          />
          <TextInput
            style={styles.stepInput}
            placeholder="Water (ml)"
            keyboardType="numeric"
            value={getValue(index, 'water')}
            onChangeText={(v) => setValue(index, 'water', v)}
          />
          <TouchableOpacity onPress={() => remove(index)} style={styles.removeBtn}>
            <Text style={styles.removeText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => append({ time: 0, water: 0 })}
      >
        <Text style={styles.addText}>+ Add step</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  stepNum: { width: 20, fontSize: 14, color: '#999', textAlign: 'center' },
  stepInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#fafafa',
    color: '#1a1a1a',
  },
  removeBtn: { padding: 4 },
  removeText: { color: '#dc2626', fontSize: 20, lineHeight: 22 },
  addBtn: { borderWidth: 1, borderColor: '#4285F4', borderStyle: 'dashed', borderRadius: 8, padding: 10, alignItems: 'center' },
  addText: { color: '#4285F4', fontWeight: '500' },
  error: { color: '#e53e3e', fontSize: 12, marginTop: 4 },
})
