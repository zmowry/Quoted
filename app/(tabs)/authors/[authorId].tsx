import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { authorById } from '@/src/data/authorsData';
import { useQuoteBank } from '@/src/hooks/useQuoteBank';
import type { Quote } from '@/src/types';
import { colors } from '@/src/theme';

export function AuthorDetail({ authorId }: { authorId: string }): JSX.Element {
  const author = authorById(authorId); const { quotes, saveQuote, removeQuote } = useQuoteBank();
  if (!author) return <View style={styles.page}><Text>Author not found.</Text></View>;
  return <ScrollView contentContainerStyle={styles.page}><Text style={styles.name}>{author.name}</Text><Text style={styles.bio}>{author.bio}</Text>{author.quotes.map((rawQuote) => { const quote: Quote = { ...rawQuote, authorName: author.name }; const saved = quotes.some((item) => item.id === quote.id); return <View key={quote.id} style={styles.quoteCard}><Text style={styles.quote}>“{quote.text}”</Text><Pressable accessibilityRole="button" accessibilityLabel={saved ? `Remove ${quote.text}` : `Save ${quote.text}`} style={[styles.save, saved && styles.remove]} onPress={() => void (saved ? removeQuote(quote.id) : saveQuote(quote))}><Text style={styles.saveText}>{saved ? 'Remove from My Bank' : '+ Save to My Bank'}</Text></Pressable></View>; })}</ScrollView>;
}
export default function AuthorDetailScreen(): JSX.Element { const { authorId } = useLocalSearchParams<{ authorId: string }>(); return <AuthorDetail authorId={authorId} />; }
const styles = StyleSheet.create({ page: { padding: 20, backgroundColor: colors.cream, flexGrow: 1 }, name: { fontSize: 29, fontWeight: '800', color: colors.chocolate }, bio: { marginTop: 10, marginBottom: 22, fontSize: 16, lineHeight: 23, color: colors.mutedChocolate }, quoteCard: { backgroundColor: colors.white, borderRadius: 16, borderColor: colors.border, borderWidth: 1, padding: 18, marginBottom: 14 }, quote: { fontSize: 18, lineHeight: 26, color: colors.chocolate }, save: { alignSelf: 'flex-start', marginTop: 16, backgroundColor: colors.caramel, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 9 }, remove: { backgroundColor: colors.burntCaramel }, saveText: { color: colors.white, fontWeight: '800' } });
