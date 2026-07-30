import type { ReactElement } from 'react';
import { Stack } from 'expo-router';
import { useNotificationRoute } from '@/src/hooks/useNotificationRoute';
import { QuoteBankProvider } from '@/src/hooks/useQuoteBank';
import { ThemeProvider, useTheme } from '@/src/hooks/useTheme';

/**
 * Split out so it sits *below* ThemeProvider and can therefore read the palette:
 * the history header has to be themed, and RootLayout renders the provider itself.
 */
function RootStack(): ReactElement {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      {/* A pushed native Stack screen, so iOS supplies the back chevron and
          edge-swipe for free. Header options mirror the authors stack. */}
      <Stack.Screen
        name="history"
        options={{
          headerShown: true,
          title: 'Quote history',
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.chocolate,
          headerTitleStyle: { fontWeight: '700', color: colors.chocolate },
        }}
      />
    </Stack>
  );
}

export default function RootLayout(): ReactElement {
  // Mounted for the whole app, so a tap is picked up whichever screen is showing.
  useNotificationRoute();
  return <ThemeProvider><QuoteBankProvider><RootStack /></QuoteBankProvider></ThemeProvider>;
}
