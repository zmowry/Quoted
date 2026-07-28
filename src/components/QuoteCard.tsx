import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import type { Quote } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';
import type { Colors } from '@/src/theme';

interface Props {
  quote: Quote;
  onDelete?: () => void;
  onTag?: () => void;
}

export function QuoteCard({ quote, onDelete, onTag }: Props): ReactElement {
  const { colors, scale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    await Clipboard.setStringAsync(quote.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.quote}>"{quote.text}"</Text>
      <View style={styles.footer}>
        <Pressable onPress={() => router.push(`/authors/${quote.authorId}`)} style={styles.authorBtn}>
          <Text style={styles.author}>-- {quote.authorName}</Text>
        </Pressable>
        <View style={styles.actions}>
          <Pressable onPress={() => void handleCopy()} accessibilityLabel="Copy quote" style={styles.actionBtn}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={copied ? colors.caramel : colors.taupe} />
          </Pressable>
          {onTag ? (
            <Pressable onPress={onTag} accessibilityLabel="Add to collection" style={styles.actionBtn}>
              <Ionicons name="bookmark-outline" size={14} color={colors.taupe} />
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable onPress={onDelete} accessibilityLabel={`Delete ${quote.text}`} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={14} color={colors.taupe} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors, scale: (n: number) => number) {
  return StyleSheet.create({
    card: { backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, shadowColor: colors.chocolate, shadowOpacity: .08, shadowRadius: 6, elevation: 2 },
    quote: { fontSize: scale(14), lineHeight: scale(20), color: colors.chocolate },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    authorBtn: { flex: 1 },
    author: { color: colors.burntCaramel, fontWeight: '700', fontSize: scale(12) },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    actionBtn: { padding: 2 },
  });
}
