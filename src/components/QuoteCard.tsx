import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Quote } from '@/src/types';
import { quoteWithAttribution } from '@/src/format';
import { useCopyFeedback } from '@/src/hooks/useCopyFeedback';
import { useQuoteShare } from '@/src/hooks/useQuoteShare';
import { isCustomQuote } from '@/src/customQuotes';
import { useTheme } from '@/src/hooks/useTheme';
import { QUOTE_FONT } from '@/src/theme';
import type { Colors } from '@/src/theme';

interface Props {
  quote: Quote;
  onDelete?: () => void;
  onTag?: () => void;
  onEdit?: () => void;
}

export function QuoteCard({ quote, onDelete, onTag, onEdit }: Props): ReactElement {
  const { colors, scale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  const router = useRouter();
  const { copied, copy } = useCopyFeedback();
  const { sharingId, shareQuote } = useQuoteShare();
  const sharing = sharingId === quote.id;
  // A quote the user wrote has no author record, so linking it would land on
  // "Author not found." The check lives here rather than in a prop from the
  // screen so every caller — including the history list — gets it for free.
  const custom = isCustomQuote(quote);

  return (
    <View style={styles.card}>
      <Text style={styles.quote}>"{quote.text}"</Text>
      <View style={styles.footer}>
        {custom ? (
          <Text style={[styles.author, styles.authorBtn]}>-- {quote.authorName}</Text>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel={`View quotes by ${quote.authorName}`} onPress={() => router.push(`/authors/${quote.authorId}`)} style={styles.authorBtn}>
            <Text style={styles.author}>-- {quote.authorName}</Text>
          </Pressable>
        )}
        <View style={styles.actions}>
          <Pressable onPress={() => void copy(quoteWithAttribution(quote))} accessibilityLabel="Copy quote" style={styles.actionBtn}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={copied ? colors.caramel : colors.taupe} />
          </Pressable>
          {/* Available on every card, including history: sharing reads the quote
              rather than mutating the bank, so it is safe where editing is not. */}
          <Pressable onPress={() => shareQuote(quote)} accessibilityLabel={`Share ${quote.text}`} disabled={sharing} style={styles.actionBtn}>
            <Ionicons name="share-outline" size={14} color={sharing ? colors.caramel : colors.taupe} />
          </Pressable>
          {onTag ? (
            <Pressable onPress={onTag} accessibilityLabel="Add to collection" style={styles.actionBtn}>
              <Ionicons name="bookmark-outline" size={14} color={colors.taupe} />
            </Pressable>
          ) : null}
          {onEdit ? (
            <Pressable onPress={onEdit} accessibilityLabel={`Edit ${quote.text}`} style={styles.actionBtn}>
              <Ionicons name="pencil-outline" size={14} color={colors.taupe} />
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
    quote: { fontFamily: QUOTE_FONT, fontSize: scale(14), lineHeight: scale(20), color: colors.chocolate },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    authorBtn: { flex: 1 },
    author: { color: colors.burntCaramel, fontWeight: '700', fontSize: scale(12) },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    actionBtn: { padding: 2 },
  });
}
