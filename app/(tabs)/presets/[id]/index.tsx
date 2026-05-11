import { useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ScreenContainer } from '@/components/ScreenContainer'
import { deletePreset, getPreset } from '@/features/presets/api'
import type { Preset } from '@/types/domain'

export default function PresetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [preset, setPreset] = useState<Preset | null>(null)

  useEffect(() => {
    if (id) getPreset(id).then(setPreset)
  }, [id])

  if (!preset) {
    return (
      <ScreenContainer>
        <Text style={styles.empty}>Loading...</Text>
      </ScreenContainer>
    )
  }

  function confirmDelete() {
    Alert.alert('Delete Preset', `Delete "${preset!.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePreset(preset!.id)
          router.back()
        },
      },
    ])
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>{preset.name}</Text>
      {preset.description ? <Text style={styles.desc}>{preset.description}</Text> : null}

      <View style={styles.meta}>
        <Text style={styles.metaText}>Brew ratio: {preset.brewRatio}:1</Text>
        <Text style={styles.metaText}>Steps: {preset.steps.length}</Text>
      </View>

      {preset.steps.length > 0 && (
        <View style={styles.steps}>
          <Text style={styles.sectionTitle}>Steps</Text>
          {preset.steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <Text style={styles.stepNum}>{i + 1}</Text>
              <Text style={styles.stepText}>
                {step.time}s — {step.water}ml
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/(tabs)/presets/${id}/edit`)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  desc: { fontSize: 15, color: '#666', marginBottom: 16 },
  meta: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 20, gap: 4 },
  metaText: { fontSize: 14, color: '#333' },
  steps: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  step: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4285F4', textAlign: 'center', lineHeight: 24, color: '#fff', fontSize: 13, fontWeight: '600' },
  stepText: { fontSize: 15, color: '#1a1a1a' },
  actions: { flexDirection: 'row', gap: 12 },
  editButton: { flex: 1, backgroundColor: '#4285F4', padding: 14, borderRadius: 8, alignItems: 'center' },
  editButtonText: { color: '#fff', fontWeight: '600' },
  deleteButton: { flex: 1, backgroundColor: '#fee2e2', padding: 14, borderRadius: 8, alignItems: 'center' },
  deleteButtonText: { color: '#dc2626', fontWeight: '600' },
  empty: { color: '#999', textAlign: 'center', marginTop: 48 },
})
