import { Stack } from 'expo-router';
import { QuoteBankProvider } from '@/src/hooks/useQuoteBank';

export default function RootLayout(): JSX.Element {
  return <QuoteBankProvider><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /></Stack></QuoteBankProvider>;
}
