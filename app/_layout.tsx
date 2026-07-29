import type { ReactElement } from 'react';
import { Stack } from 'expo-router';
import { useNotificationRoute } from '@/src/hooks/useNotificationRoute';
import { QuoteBankProvider } from '@/src/hooks/useQuoteBank';
import { ThemeProvider } from '@/src/hooks/useTheme';

export default function RootLayout(): ReactElement {
  // Mounted for the whole app, so a tap is picked up whichever screen is showing.
  useNotificationRoute();
  return <ThemeProvider><QuoteBankProvider><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /></Stack></QuoteBankProvider></ThemeProvider>;
}
