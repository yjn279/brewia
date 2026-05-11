import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4285F4',
        headerShown: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="beans" options={{ title: 'Beans', href: '/beans' }} />
      <Tabs.Screen name="brews" options={{ title: 'Brews', href: '/brews' }} />
      <Tabs.Screen name="presets" options={{ title: 'Presets', href: '/presets' }} />
    </Tabs>
  )
}
