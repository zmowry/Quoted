import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Quote } from '@/src/types';

export function QuoteCard({ quote, onDelete }: { quote: Quote; onDelete?: () => void }): JSX.Element {
  return <View style={styles.card}><Text style={styles.quote}>“{quote.text}”</Text><Text style={styles.author}>— {quote.authorName}</Text>{onDelete ? <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${quote.text}`} onPress={onDelete}><Text style={styles.delete}>Delete</Text></Pressable> : null}</View>;
}
const styles = StyleSheet.create({ card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: .08, shadowRadius: 8, elevation: 2 }, quote: { fontSize: 17, lineHeight: 25, color: '#263238' }, author: { marginTop: 10, color: '#546e7a', fontWeight: '600' }, delete: { color: '#b3261e', marginTop: 14, fontWeight: '700' } });
