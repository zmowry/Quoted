import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { QuoteCard } from '@/src/components/QuoteCard';
import { dayLabel } from '@/src/format';
import { useQuoteBank } from '@/src/hooks/useQuoteBank';
import { useTheme } from '@/src/hooks/useTheme';
import { dateKey, deliveredHistory, deliveryStats } from '@/src/services/queueManager';
import type { DeliveredHistory, DeliveryStats } from '@/src/services/queueManager';
import type { Colors } from '@/src/theme';

function Stat({ value, label, styles }: { value: string; label: string; styles: ReturnType<typeof makeStyles> }): ReactElement {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HistoryScreen(): ReactElement {
  const { quotes, deliveryPool, loading } = useQuoteBank();
  const { colors, scale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  const [history, setHistory] = useState<DeliveredHistory>({ entries: [], missing: 0 });
  const [stats, setStats] = useState<DeliveryStats>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    void Promise.all([deliveredHistory(quotes), deliveryStats(quotes, deliveryPool)]).then(([result, figures]) => {
      if (cancelled) return;
      setHistory(result);
      setStats(figures);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [quotes, deliveryPool, loading]);

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
      // Rendered even with no entries: someone whose only delivered quote has
      // been deleted still has a streak worth seeing above the empty state.
      ListHeaderComponent={stats && stats.daysDelivered > 0 ? (
        <View style={styles.statsCard} testID="delivery-stats">
          <View style={styles.statsRow}>
            <Stat styles={styles} value={`${stats.currentStreak}`} label="day streak" />
            <Stat styles={styles} value={`${stats.totalDelivered}`} label={stats.totalDelivered === 1 ? 'quote delivered' : 'quotes delivered'} />
            <Stat styles={styles} value={`${stats.cycle.shown}/${stats.cycle.total}`} label="this cycle" />
          </View>
          <View style={styles.statsFooter}>
            {/* Named as a window, not a record: only 21 days of assignments are
                kept, so a longer run genuinely cannot be measured from here. */}
            <Text style={styles.statsNote}>Best run in the last 21 days: {stats.bestStreak} {stats.bestStreak === 1 ? 'day' : 'days'}</Text>
            {stats.topAuthor ? (
              <Text style={styles.statsNote}>Most delivered: {stats.topAuthor.name} ({stats.topAuthor.count})</Text>
            ) : null}
          </View>
        </View>
      ) : null}
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
    statsCard: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 16 },
    statsRow: { flexDirection: 'row', alignItems: 'flex-start' },
    stat: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
    statValue: { fontSize: scale(22), fontWeight: '800', color: colors.chocolate },
    statLabel: { marginTop: 3, fontSize: scale(11), fontWeight: '600', color: colors.mutedChocolate, textAlign: 'center', lineHeight: scale(15) },
    statsFooter: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, gap: 3 },
    statsNote: { fontSize: scale(12), color: colors.mutedChocolate },
    entry: { marginBottom: 6 },
    slotLabel: { fontSize: scale(11), fontWeight: '800', color: colors.mutedChocolate, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 5 },
    footnote: { marginTop: 10, fontSize: scale(12), color: colors.taupe, lineHeight: scale(17) },
    empty: { alignItems: 'center', padding: 30, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    emptyTitle: { fontSize: scale(18), fontWeight: '800', color: colors.chocolate },
    emptyText: { color: colors.mutedChocolate, textAlign: 'center', marginTop: 8, lineHeight: scale(21), fontSize: scale(14) },
  });
}
