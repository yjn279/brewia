import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { BrewCard } from '@/components/BrewCard'
import { ScreenContainer } from '@/components/ScreenContainer'
import { listBeans } from '@/features/beans/api'
import { listBrews } from '@/features/brews/api'
import type { Bean, Brew } from '@/types/domain'

export default function BrewsListScreen() {
  const [brews, setBrews] = useState<Brew[]>([])
  const [beans, setBeans] = useState<Bean[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listBrews(), listBeans()])
      .then(([b, bn]) => {
        setBrews(b)
        setBeans(bn)
      })
      .finally(() => setLoading(false))
  }, [])

  const beanMap = Object.fromEntries(beans.map((b) => [b.id, b.name]))

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Brews</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/brews/new')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : brews.length === 0 ? (
        <Text style={styles.empty}>No brews yet. Log your first brew!</Text>
      ) : (
        <FlatList
          data={brews}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <BrewCard
              brew={item}
              beanName={beanMap[item.beanId]}
              onPress={() => router.push(`/(tabs)/brews/${item.id}`)}
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
