import { Stack } from 'expo-router';

/** Nested stack keeps author profiles out of the tab bar. */
export default function AuthorsLayout(): JSX.Element {
  return <Stack><Stack.Screen name="index" options={{ title: 'Authors' }} /><Stack.Screen name="[authorId]" options={{ title: 'Author' }} /></Stack>;
}
