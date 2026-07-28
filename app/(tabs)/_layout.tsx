import type { ReactElement } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';

export default function TabsLayout(): ReactElement {
  const { colors } = useTheme();
  return (
    <Tabs screenOptions={{
      headerTitleStyle: { fontWeight: '700', color: colors.chocolate },
      headerStyle: { backgroundColor: colors.cream },
      tabBarStyle: { backgroundColor: colors.cream, borderTopColor: colors.border },
      tabBarActiveTintColor: colors.caramel,
      tabBarInactiveTintColor: colors.mutedChocolate,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Quote Bank', tabBarIcon: ({ color }) => <FontAwesome name="bookmark" color={color} size={20} /> }} />
      <Tabs.Screen name="authors" options={{ title: 'Authors', headerShown: false, tabBarIcon: ({ color }) => <FontAwesome name="pencil" color={color} size={20} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <FontAwesome name="cog" color={color} size={20} /> }} />
    </Tabs>
  );
}
