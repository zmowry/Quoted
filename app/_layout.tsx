import { Stack } from 'expo-router';
import { QuoteBankProvider } from '@/src/hooks/useQuoteBank';
import { ThemeProvider } from '@/src/hooks/useTheme';

export default function RootLayout(): JSX.Element {
  return <ThemeProvider><QuoteBankProvider><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /></Stack></QuoteBankProvider></ThemeProvider>;
}
