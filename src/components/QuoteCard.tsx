import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Quote } from '@/src/types';
import { colors } from '@/src/theme';

export function QuoteCard({ quote, onDelete }: { quote: Quote; onDelete?: () => void }): JSX.Element {
  return <View style={styles.card}><Text style={styles.quote}>“{quote.text}”</Text><Text style={styles.author}>— {quote.authorName}</Text>{onDelete ? <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${quote.text}`} onPress={onDelete}><Text style={styles.delete}>Delete</Text></Pressable> : null}</View>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.white, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border, shadowColor: colors.chocolate, shadowOpacity: .08, shadowRadius: 8, elevation: 2 }, quote: { fontSize: 17, lineHeight: 25, color: colors.chocolate }, author: { marginTop: 10, color: colors.mutedChocolate, fontWeight: '600' }, delete: { color: colors.danger, marginTop: 14, fontWeight: '800' } });
