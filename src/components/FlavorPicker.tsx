import { useEffect, useState } from 'react'
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { listFlavors } from '@/features/flavors/api'
import type { Flavor } from '@/types/domain'

interface FlavorPickerProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function FlavorPicker({ selectedIds, onChange }: FlavorPickerProps) {
  const [open, setOpen] = useState(false)
  const [flavors, setFlavors] = useState<Flavor[]>([])

  useEffect(() => {
    listFlavors().then(setFlavors).catch(() => {})
  }, [])

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const selectedNames = flavors
    .filter((f) => selectedIds.includes(f.id))
    .map((f) => f.name)
    .join(', ')

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Flavors</Text>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={selectedNames ? styles.triggerText : styles.placeholder}>
          {selectedNames || 'Select flavors...'}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setOpen(false)}
          activeOpacity={1}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Flavors</Text>
            <FlatList
              data={flavors}
              keyExtractor={(f) => f.id}
              renderItem={({ item }) => {
                const selected = selectedIds.includes(item.id)
                return (
                  <TouchableOpacity
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => toggle(item.id)}
                  >
                    <Text style={styles.category}>{item.category}</Text>
                    <Text style={[styles.name, selected && styles.nameSelected]}>
                      {item.name}
                    </Text>
                    {selected && <Text style={styles.check}>✓</Text>}
                  </TouchableOpacity>
                )
              }}
            />
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setOpen(false)}
            >
              <Text style={styles.doneText}>Done ({selectedIds.length})</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 6 },
  trigger: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  triggerText: { fontSize: 15, color: '#1a1a1a', flex: 1 },
  placeholder: { fontSize: 15, color: '#aaa', flex: 1 },
  chevron: { color: '#999', fontSize: 14 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '75%' },
  sheetTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: 'center', color: '#333' },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  optionSelected: { backgroundColor: '#EBF4FF' },
  category: { fontSize: 11, color: '#999', width: 80 },
  name: { fontSize: 15, color: '#1a1a1a', flex: 1 },
  nameSelected: { color: '#4285F4', fontWeight: '600' },
  check: { color: '#4285F4', fontSize: 16 },
  doneButton: { marginTop: 12, backgroundColor: '#4285F4', padding: 14, borderRadius: 8, alignItems: 'center' },
  doneText: { color: '#fff', fontWeight: '600', fontSize: 15 },
})
