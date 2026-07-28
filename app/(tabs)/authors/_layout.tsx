import type { ReactElement } from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';

export default function AuthorsLayout(): ReactElement {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.cream },
      headerTintColor: colors.chocolate,
      headerTitleStyle: { fontWeight: '700', color: colors.chocolate },
    }}>
      <Stack.Screen name="index" options={{ title: 'Authors' }} />
      <Stack.Screen name="[authorId]" options={{ title: 'Author' }} />
    </Stack>
  );
}
