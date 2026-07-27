import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import { shareAsync } from 'expo-sharing';
import { QuoteCard } from '@/src/components/QuoteCard';
import { useQuoteBank } from '@/src/hooks/useQuoteBank';
import { useTheme } from '@/src/hooks/useTheme';
import type { Colors } from '@/src/theme';
import { authorPhotos } from '@/src/data/authorPhotos';

type AuthorGroup = { id: string; authorName: string };

export default function QuoteBankScreen(): JSX.Element {
  const { quotes, quoteOfDay, loading, removeQuote } = useQuoteBank();
  const { colors, scale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'random' | 'author'>('random');
  const [sharing, setSharing] = useState(false);
  const bannerRef = useRef<View>(null);

  const authorGroups = useMemo<AuthorGroup[]>(() => {
    const seen = new Map<string, AuthorGroup>();
    for (const q of quotes) {
      if (!seen.has(q.authorId)) seen.set(q.authorId, { id: q.authorId, authorName: q.authorName });
    }
    return Array.from(seen.values()).sort((a, b) => a.authorName.localeCompare(b.authorName));
  }, [quotes]);

  const shareQuote = async (): Promise<void> => {
    if (!bannerRef.current || sharing) return;
    try {
      setSharing(true);
      const uri = await captureRef(bannerRef, { format: 'png', quality: 1 });
      await shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your quote' });
    } catch {
      // share cancelled or unavailable — silently ignore
    } finally {
      setSharing(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  const banner = (
    <View>
      <View ref={bannerRef} style={styles.banner} collapsable={false}>
        <Text style={styles.kicker}>QUOTE OF THE DAY</Text>
        <Text style={styles.bannerQuote}>{quoteOfDay ? `\u201C${quoteOfDay.text}\u201D` : 'No quotes saved!'}</Text>
        {quoteOfDay
          ? <Text style={styles.bannerAuthor}>{quoteOfDay.authorName}</Text>
          : <Text style={styles.bannerAuthor}>Save one from Explore to start your daily cycle.</Text>}
        {quoteOfDay ? (
          <Pressable accessibilityRole="button" onPress={() => router.push(`/authors/${quoteOfDay.authorId}`)} style={styles.moreRow}>
            <Text style={styles.moreText}>More from this author</Text>
            {authorPhotos[quoteOfDay.authorId] ? <Image source={authorPhotos[quoteOfDay.authorId]} style={styles.authorPhoto} /> : null}
          </Pressable>
        ) : null}
      </View>
      {quoteOfDay ? (
        <Pressable accessibilityRole="button" onPress={() => void shareQuote()} style={styles.shareRow} disabled={sharing}>
          <Ionicons name="share-outline" size={13} color={colors.mutedChocolate} />
          <Text style={styles.shareText}>{sharing ? 'Preparing...' : 'Share quote'}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const headingRow = (
    <View style={styles.headingRow}>
      <Text style={styles.heading}>My saved quotes</Text>
      <View style={styles.toggle}>
        <Pressable onPress={() => setViewMode('random')} style={[styles.toggleBtn, viewMode === 'random' && styles.toggleActive]}>
          <Ionicons name="shuffle" size={15} color={viewMode === 'random' ? colors.white : colors.mutedChocolate} />
        </Pressable>
        <Pressable onPress={() => setViewMode('author')} style={[styles.toggleBtn, viewMode === 'author' && styles.toggleActive]}>
          <Ionicons name="people" size={15} color={viewMode === 'author' ? colors.white : colors.mutedChocolate} />
        </Pressable>
      </View>
    </View>
  );

  const header = <View>{banner}{headingRow}</View>;

  if (quotes.length === 0) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
        {header}
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your quote bank is empty</Text>
          <Text style={styles.emptyText}>Explore authors and save the words you want to revisit.</Text>
        </View>
      </ScrollView>
    );
  }

  if (viewMode === 'author') {
    return (
      <FlatList<AuthorGroup>
        style={styles.scroll}
        contentContainerStyle={styles.page}
        data={authorGroups}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.authorCard}>
            {authorPhotos[item.id] ? <Image source={authorPhotos[item.id]} style={styles.authorCardPhoto} /> : null}
            <Text style={styles.authorCardName}>{item.authorName}</Text>
          </View>
        )}
      />
    );
  }

  return (
    <FlatList
      style={styles.scroll}
      contentContainerStyle={styles.page}
      data={quotes}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => <QuoteCard quote={item} onDelete={() => void removeQuote(item.id)} />}
    />
  );
}

function makeStyles(colors: Colors, scale: (n: number) => number) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.cream },
    page: { padding: 16 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
    banner: { backgroundColor: colors.chocolate, borderRadius: 20, padding: 22, shadowColor: colors.chocolate, shadowOpacity: .18, shadowRadius: 12, elevation: 4 },
    kicker: { fontWeight: '800', color: colors.gold, fontSize: scale(12), letterSpacing: 1.2 },
    bannerQuote: { color: colors.white, fontSize: scale(20), lineHeight: scale(29), marginTop: 9, fontWeight: '600' },
    bannerAuthor: { color: colors.softCream, marginTop: 9, fontSize: scale(14) },
    moreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
    moreText: { color: colors.gold, fontWeight: '800', fontSize: scale(14) },
    authorPhoto: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.gold },
    shareRow: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4, marginBottom: 14 },
    shareText: { fontSize: scale(12), color: colors.mutedChocolate, fontWeight: '600' },
    headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    heading: { fontSize: scale(22), fontWeight: '800', color: colors.chocolate },
    toggle: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 8, padding: 2, gap: 2 },
    toggleBtn: { padding: 6, borderRadius: 6 },
    toggleActive: { backgroundColor: colors.chocolate },
    authorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, shadowColor: colors.chocolate, shadowOpacity: .08, shadowRadius: 6, elevation: 2, gap: 14 },
    authorCardPhoto: { width: 48, height: 48, borderRadius: 24 },
    authorCardName: { fontSize: scale(16), fontWeight: '700', color: colors.chocolate },
    empty: { alignItems: 'center', padding: 30, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    emptyTitle: { fontSize: scale(18), fontWeight: '800', color: colors.chocolate },
    emptyText: { color: colors.mutedChocolate, textAlign: 'center', marginTop: 8, lineHeight: scale(21), fontSize: scale(14) },
  });
}
