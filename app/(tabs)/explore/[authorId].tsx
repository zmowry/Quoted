import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { authorById } from '@/src/data/authorsData';
import { useQuoteBank } from '@/src/hooks/useQuoteBank';
import type { Quote } from '@/src/types';

export function AuthorDetail({ authorId }: { authorId: string }): JSX.Element {
  const author = authorById(authorId); const { quotes, saveQuote } = useQuoteBank();
  if (!author) return <View style={styles.page}><Text>Author not found.</Text></View>;
  return <ScrollView contentContainerStyle={styles.page}><Text style={styles.name}>{author.name}</Text><Text style={styles.bio}>{author.bio}</Text>{author.quotes.map((rawQuote) => { const quote: Quote = { ...rawQuote, authorName: author.name }; const saved = quotes.some((item) => item.id === quote.id); return <View key={quote.id} style={styles.quoteCard}><Text style={styles.quote}>“{quote.text}”</Text><Pressable accessibilityRole="button" accessibilityLabel={`Save ${quote.text}`} disabled={saved} style={[styles.save, saved && styles.saved]} onPress={() => void saveQuote(quote)}><Text style={styles.saveText}>{saved ? 'Saved to My Bank' : '+ Save to My Bank'}</Text></Pressable></View>; })}</ScrollView>;
}
export default function AuthorDetailScreen(): JSX.Element { const { authorId } = useLocalSearchParams<{ authorId: string }>(); return <AuthorDetail authorId={authorId} />; }
const styles = StyleSheet.create({ page: { padding: 20, backgroundColor: '#f5f7fa', flexGrow: 1 }, name: { fontSize: 29, fontWeight: '800', color: '#263238' }, bio: { marginTop: 10, marginBottom: 22, fontSize: 16, lineHeight: 23, color: '#546e7a' }, quoteCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 14 }, quote: { fontSize: 18, lineHeight: 26, color: '#263238' }, save: { alignSelf: 'flex-start', marginTop: 16, backgroundColor: '#00796b', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }, saved: { backgroundColor: '#78909c' }, saveText: { color: '#fff', fontWeight: '800' } });
