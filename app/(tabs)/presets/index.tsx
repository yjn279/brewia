import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { PresetCard } from '@/components/PresetCard'
import { ScreenContainer } from '@/components/ScreenContainer'
import { listPresets } from '@/features/presets/api'
import type { Preset } from '@/types/domain'

export default function PresetsListScreen() {
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPresets()
      .then(setPresets)
      .finally(() => setLoading(false))
  }, [])

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Presets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/presets/new')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : presets.length === 0 ? (
        <Text style={styles.empty}>No presets yet. Create your first preset!</Text>
      ) : (
        <FlatList
          data={presets}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PresetCard
              preset={item}
              onPress={() => router.push(`/(tabs)/presets/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  addButton: { backgroundColor: '#4285F4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 48, fontSize: 15 },
})
