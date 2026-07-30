import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { QuoteCard } from '@/src/components/QuoteCard';
import { dayLabel } from '@/src/format';
import { useQuoteBank } from '@/src/hooks/useQuoteBank';
import { useTheme } from '@/src/hooks/useTheme';
import { dateKey, deliveredHistory } from '@/src/services/queueManager';
import type { DeliveredHistory } from '@/src/services/queueManager';
import type { Colors } from '@/src/theme';

export default function HistoryScreen(): ReactElement {
  const { quotes, loading } = useQuoteBank();
  const { colors, scale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  const [history, setHistory] = useState<DeliveredHistory>({ entries: [], missing: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    void deliveredHistory(quotes).then((result) => {
      if (cancelled) return;
      setHistory(result);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [quotes, loading]);

  // The read is async, and flashing the empty state first reads as "you have no
  // history" rather than "still loading".
  if (!ready) return <View style={styles.center}><ActivityIndicator /></View>;

  const today = dateKey();

  return (
    <FlatList
      style={styles.scroll}
      contentContainerStyle={styles.page}
      data={history.entries}
      keyExtractor={(entry) => entry.slot}
      ListEmptyComponent={(
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptyText}>Quotes appear here once they have been delivered to you.</Text>
        </View>
      )}
      ListFooterComponent={history.missing > 0 ? (
        <Text style={styles.footnote}>
          {history.missing} earlier {history.missing === 1 ? 'quote is' : 'quotes are'} not shown because you have removed {history.missing === 1 ? 'it' : 'them'}.
        </Text>
      ) : null}
      renderItem={({ item }) => (
        <View style={styles.entry}>
          <Text style={styles.slotLabel}>
            {dayLabel(item.day, today)} · {item.extra === 0 ? 'Daily quote' : `Extra quote ${item.extra + 1}`}
          </Text>
          {/* No onDelete/onTag/onEdit: history is a record, not a place to edit the
              bank. The reuse also inherits the serif and the custom-quote author
              handling for nothing. */}
          <QuoteCard quote={item.quote} />
        </View>
      )}
    />
  );
}

function makeStyles(colors: Colors, scale: (n: number) => number) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.cream },
    page: { padding: 16 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
    entry: { marginBottom: 6 },
    slotLabel: { fontSize: scale(11), fontWeight: '800', color: colors.mutedChocolate, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 },
    footnote: { marginTop: 10, fontSize: scale(12), color: colors.taupe, lineHeight: scale(17) },
    empty: { alignItems: 'center', padding: 30, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    emptyTitle: { fontSize: scale(18), fontWeight: '800', color: colors.chocolate },
    emptyText: { color: colors.mutedChocolate, textAlign: 'center', marginTop: 8, lineHeight: scale(21), fontSize: scale(14) },
  });
}
