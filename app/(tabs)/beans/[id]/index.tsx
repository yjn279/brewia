import { useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ScreenContainer } from '@/components/ScreenContainer'
import { deleteBean, getBean } from '@/features/beans/api'
import type { Bean } from '@/types/domain'
import { COUNTRY_FLAGS } from '@/types/domain'

export default function BeanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [bean, setBean] = useState<Bean | null>(null)

  useEffect(() => {
    if (id) getBean(id).then(setBean)
  }, [id])

  if (!bean) {
    return (
      <ScreenContainer>
        <Text style={styles.empty}>Loading...</Text>
      </ScreenContainer>
    )
  }

  function confirmDelete() {
    Alert.alert('Delete Bean', `Delete "${bean!.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBean(bean!.id)
          router.back()
        },
      },
    ])
  }

  const flag = COUNTRY_FLAGS[bean.country as keyof typeof COUNTRY_FLAGS] ?? ''

  return (
    <ScreenContainer>
      <Text style={styles.flag}>{flag}</Text>
      <Text style={styles.name}>{bean.name}</Text>
      <Text style={styles.sub}>{bean.roaster}</Text>

      <View style={styles.grid}>
        <Row label="Country" value={bean.country} />
        <Row label="Region" value={bean.region} />
        <Row label="Farm" value={bean.farm} />
        <Row label="Variety" value={bean.variety} />
        <Row label="Process" value={bean.process} />
        <Row label="Roast" value={bean.roast} />
        <Row label="Price" value={bean.priceJpy ? `¥${bean.priceJpy}` : '-'} />
      </View>

      {bean.notes ? (
        <View style={styles.notes}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{bean.notes}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/(tabs)/beans/${id}/edit`)}
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
      <Text style={styles.rowValue}>{value || '-'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  flag: { fontSize: 40, marginBottom: 8 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  sub: { fontSize: 15, color: '#666', marginBottom: 24 },
  grid: { marginBottom: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, color: '#1a1a1a', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
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
