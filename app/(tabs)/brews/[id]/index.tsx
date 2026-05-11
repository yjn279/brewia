import { useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ScreenContainer } from '@/components/ScreenContainer'
import { getBean } from '@/features/beans/api'
import { deleteBrew, getBrew } from '@/features/brews/api'
import { listFlavors, listBrewFlavors } from '@/features/flavors/api'
import type { Bean, Brew, Flavor } from '@/types/domain'

export default function BrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [brew, setBrew] = useState<Brew | null>(null)
  const [bean, setBean] = useState<Bean | null>(null)
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [brewFlavorIds, setBrewFlavorIds] = useState<string[]>([])

  useEffect(() => {
    if (!id) return
    getBrew(id).then((b) => {
      setBrew(b)
      if (b) getBean(b.beanId).then(setBean)
    })
    listFlavors().then(setFlavors)
    listBrewFlavors(id).then(setBrewFlavorIds)
  }, [id])

  if (!brew) {
    return (
      <ScreenContainer>
        <Text style={styles.empty}>Loading...</Text>
      </ScreenContainer>
    )
  }

  const brewFlavors = flavors.filter((f) => brewFlavorIds.includes(f.id))

  function confirmDelete() {
    Alert.alert('Delete Brew', 'Delete this brew?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBrew(brew!.id)
          router.back()
        },
      },
    ])
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>{bean?.name ?? 'Unknown Bean'}</Text>
      <Text style={styles.sub}>{bean?.roaster ?? ''}</Text>

      <View style={styles.grid}>
        <Row label="Bean weight" value={`${brew.beanWeight}g`} />
        <Row label="Grind" value={brew.beanGrind ? String(brew.beanGrind) : '-'} />
        <Row label="Water" value={`${brew.waterWeight}ml`} />
        <Row label="Temp" value={brew.waterTemp ? `${brew.waterTemp}°C` : '-'} />
      </View>

      <Text style={styles.sectionTitle}>Scores</Text>
      <View style={styles.scores}>
        <ScoreItem label="Aroma" value={brew.aroma} />
        <ScoreItem label="Acidity" value={brew.acidity} />
        <ScoreItem label="Sweetness" value={brew.sweetness} />
        <ScoreItem label="Body" value={brew.body} />
        <ScoreItem label="Overall" value={brew.overall} />
      </View>

      {brewFlavors.length > 0 && (
        <View style={styles.flavors}>
          <Text style={styles.sectionTitle}>Flavors</Text>
          <View style={styles.flavorBadges}>
            {brewFlavors.map((f) => (
              <View key={f.id} style={styles.badge}>
                <Text style={styles.badgeText}>{f.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {brew.notes ? (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{brew.notes}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/(tabs)/brews/${id}/edit`)}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreValue}>{value}</Text>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  sub: { fontSize: 14, color: '#666', marginBottom: 20 },
  grid: { marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, color: '#1a1a1a', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  scores: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  scoreItem: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10, padding: 10, alignItems: 'center' },
  scoreValue: { fontSize: 20, fontWeight: 'bold', color: '#4285F4' },
  scoreLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  flavors: { marginBottom: 16 },
  flavorBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { backgroundColor: '#EBF4FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 13, color: '#4285F4' },
  notes: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, marginBottom: 24 },
  notesLabel: { fontSize: 13, color: '#666', marginBottom: 4 },
  notesText: { fontSize: 15, color: '#1a1a1a' },
  actions: { flexDirection: 'row', gap: 12 },
  editButton: { flex: 1, backgroundColor: '#4285F4', padding: 14, borderRadius: 8, alignItems: 'center' },
  editButtonText: { color: '#fff', fontWeight: '600' },
  deleteButton: { flex: 1, backgroundColor: '#fee2e2', padding: 14, borderRadius: 8, alignItems: 'center' },
  deleteButtonText: { color: '#dc2626', fontWeight: '600' },
  empty: { color: '#999', textAlign: 'center', marginTop: 48 },
})
