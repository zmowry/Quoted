import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Quote } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';
import type { Colors } from '@/src/theme';

export function QuoteCard({ quote, onDelete }: { quote: Quote; onDelete?: () => void }): JSX.Element {
  const { colors, scale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={styles.quote}>"{quote.text}"</Text>
          <Text style={styles.author}>-- {quote.authorName}</Text>
        </View>
        {onDelete ? <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${quote.text}`} onPress={onDelete} style={styles.deleteBtn}><Ionicons name="trash-outline" size={18} color="#BBBBBB" /></Pressable> : null}
      </View>
    </View>
  );
}

function makeStyles(colors: Colors, scale: (n: number) => number) {
  return StyleSheet.create({
    card: { backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, shadowColor: colors.chocolate, shadowOpacity: .08, shadowRadius: 6, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    content: { flex: 1 },
    quote: { fontSize: scale(14), lineHeight: scale(20), color: colors.chocolate },
    author: { marginTop: 6, color: colors.mutedChocolate, fontWeight: '600', fontSize: scale(12) },
    deleteBtn: { padding: 4, marginLeft: 8 },
  });
}
