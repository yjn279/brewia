import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { BeanCard } from '@/components/BeanCard'
import { ScreenContainer } from '@/components/ScreenContainer'
import { listBeans } from '@/features/beans/api'
import type { Bean } from '@/types/domain'

export default function BeansListScreen() {
  const [beans, setBeans] = useState<Bean[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listBeans()
      .then(setBeans)
      .finally(() => setLoading(false))
  }, [])

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Beans</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/beans/new')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <Text style={styles.empty}>Loading...</Text>
      ) : beans.length === 0 ? (
        <Text style={styles.empty}>No beans yet. Add your first bean!</Text>
      ) : (
        <FlatList
          data={beans}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <BeanCard
              bean={item}
              onPress={() => router.push(`/(tabs)/beans/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 48,
    fontSize: 15,
  },
})
