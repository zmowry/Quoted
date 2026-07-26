import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout(): JSX.Element {
  return <Tabs screenOptions={{ headerTitleStyle: { fontWeight: '700' } }}>
    <Tabs.Screen name="index" options={{ title: 'Quote Bank', tabBarIcon: ({ color }) => <FontAwesome name="bookmark" color={color} size={20} /> }} />
    <Tabs.Screen name="authors" options={{ title: 'Authors', headerShown: false, tabBarIcon: ({ color }) => <FontAwesome name="pencil" color={color} size={20} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <FontAwesome name="cog" color={color} size={20} /> }} />
  </Tabs>;
}
