import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import { shareAsync } from 'expo-sharing';
import { QuoteCard } from '@/src/components/QuoteCard';
import { CollectionModal } from '@/src/components/CollectionModal';
import { ComposeQuoteModal } from '@/src/components/ComposeQuoteModal';
import { customQuoteWith, isCustomQuote, makeCustomQuote } from '@/src/customQuotes';
import { quoteWithAttribution } from '@/src/format';
import { useCopyFeedback } from '@/src/hooks/useCopyFeedback';
import { useQuoteBank } from '@/src/hooks/useQuoteBank';
import { useTheme } from '@/src/hooks/useTheme';
import { QUOTE_FONT } from '@/src/theme';
import type { Colors } from '@/src/theme';
import type { Quote } from '@/src/types';
import { authorPhotos } from '@/src/data/authorPhotos';

type AuthorGroup = { id: string; authorName: string };

export default function QuoteBankScreen(): ReactElement {
  const { quotes, quoteOfDay, loading, saveQuote, updateCustomQuote, removeQuote, lastRemoved, undoRemove, refreshQuoteOfDay, collections, addCollection, deleteCollection, addQuoteToCollection, removeQuoteFromCollection } = useQuoteBank();
  const { colors, scale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'random' | 'author'>('random');
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [taggedQuote, setTaggedQuote] = useState<Quote | null>(null);
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [sharing, setSharing] = useState(false);
  const { copied, copy } = useCopyFeedback();
  const [refreshing, setRefreshing] = useState(false);
  const bannerRef = useRef<View>(null);

  // A tapped notification arrives as ?quote=<id> so the banner can show the quote
  // that actually fired rather than today's default.
  const params = useLocalSearchParams<{ quote?: string }>();
  const requestedId = Array.isArray(params.quote) ? params.quote[0] : params.quote;
  const [focusId, setFocusId] = useState<string | undefined>(requestedId);
  const latched = useRef<string | undefined>(requestedId);
  useEffect(() => {
    // Only a *new* tap re-focuses. Without the latch, any re-render would undo a
    // dismissal, since the param stays in the URL after it has been handled.
    if (requestedId === latched.current) return;
    latched.current = requestedId;
    setFocusId(requestedId);
  }, [requestedId]);

  // Returning on a later day must drop the focus, or a stale notification quote
  // outlives the day it was delivered.
  const seenDaily = useRef<string | undefined>(undefined);
  useEffect(() => {
    const id = quoteOfDay?.id;
    // Skipping the first defined value is what makes a cold-start tap survive:
    // quoteOfDay goes undefined -> today's quote *after* mount, and treating that
    // initial load as a day change would wipe the focus just latched.
    if (seenDaily.current !== undefined && id !== seenDaily.current) setFocusId(undefined);
    seenDaily.current = id;
  }, [quoteOfDay?.id]);

  // A quote deleted since it was delivered simply fails to resolve, so the banner
  // falls back to today's rather than rendering blank.
  const focused = focusId ? quotes.find((q) => q.id === focusId) : undefined;
  const displayed = focused ?? quoteOfDay;

  const filteredQuotes = useMemo(() => {
    let result = quotes;
    if (activeCollection) {
      const col = collections.find((c) => c.id === activeCollection);
      if (col) result = result.filter((q) => col.quoteIds.includes(q.id));
    }
    const query = search.trim().toLowerCase();
    if (query) result = result.filter((q) => q.text.toLowerCase().includes(query) || q.authorName.toLowerCase().includes(query));
    return result;
  }, [quotes, collections, activeCollection, search]);

  // Grouped from the filtered set, not the whole bank: the collection chips stay
  // on screen in this view, so ignoring them here would leave a chip highlighted
  // while the list below shows every author regardless.
  const authorGroups = useMemo<AuthorGroup[]>(() => {
    const seen = new Map<string, AuthorGroup>();
    for (const q of filteredQuotes) {
      if (!seen.has(q.authorId)) seen.set(q.authorId, { id: q.authorId, authorName: q.authorName });
    }
    return Array.from(seen.values()).sort((a, b) => a.authorName.localeCompare(b.authorName));
  }, [filteredQuotes]);

  const shareQuote = async (): Promise<void> => {
    if (!bannerRef.current || sharing) return;
    try {
      setSharing(true);
      const uri = await captureRef(bannerRef, { format: 'png', quality: 1 });
      await shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your quote' });
    } catch {
      Alert.alert('Could not share', 'Something went wrong preparing the quote image. Please try again.');
    } finally { setSharing(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  const banner = (
    <View>
      <View ref={bannerRef} style={styles.banner} collapsable={false}>
        {/* The kicker doubles as the explanation for why this is not today's quote. */}
        <Text style={styles.kicker}>{focused ? 'FROM YOUR NOTIFICATION' : 'QUOTE OF THE DAY'}</Text>
        <Text style={styles.bannerQuote}>{displayed ? `\u201C${displayed.text}\u201D` : 'No quotes saved!'}</Text>
        {displayed
          ? <Text style={styles.bannerAuthor}>{displayed.authorName}</Text>
          : <Text style={styles.bannerAuthor}>Save one from Explore to start your daily cycle.</Text>}
        {/* A quote the user wrote has no author page to go to. */}
        {displayed && !isCustomQuote(displayed) ? (
          <Pressable accessibilityRole="button" onPress={() => router.push(`/authors/${displayed.authorId}`)} style={styles.moreRow}>
            <Text style={styles.moreText}>More from this author</Text>
            {authorPhotos[displayed.authorId] ? <Image source={authorPhotos[displayed.authorId]} style={styles.authorPhoto} /> : null}
          </Pressable>
        ) : null}
      </View>
      {displayed ? (
        <View style={styles.bannerActions}>
          <Pressable accessibilityRole="button" onPress={() => void shareQuote()} style={styles.bannerActionBtn} disabled={sharing}>
            <Ionicons name="share-outline" size={13} color={colors.mutedChocolate} />
            <Text style={styles.shareText}>{sharing ? 'Preparing...' : 'Share quote'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void copy(quoteWithAttribution(displayed))} style={styles.bannerActionBtn}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={13} color={copied ? colors.caramel : colors.mutedChocolate} />
            <Text style={[styles.shareText, copied && { color: colors.caramel }]}>{copied ? 'Copied!' : 'Copy quote'}</Text>
          </Pressable>
          {/* Refresh reassigns *today's* slot, so offering it while a notification
              quote is displayed would burn a quote off-screen and leave the banner
              unchanged. Swapping it for the way back out keeps every visible
              action operating on the visible quote. */}
          {focused ? (
            <Pressable accessibilityRole="button" onPress={() => setFocusId(undefined)} style={styles.bannerActionBtn}>
              <Ionicons name="today-outline" size={13} color={colors.mutedChocolate} />
              <Text style={styles.shareText}>Show today&apos;s quote</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" onPress={async () => { if (refreshing) return; setRefreshing(true); try { await refreshQuoteOfDay(); } finally { setRefreshing(false); } }} style={styles.bannerActionBtn} disabled={refreshing}>
              <Ionicons name="refresh" size={13} color={colors.mutedChocolate} />
              <Text style={styles.shareText}>{refreshing ? 'Refreshing...' : 'Refresh'}</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );

  const collectionChips = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="collection-chips" style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
      <Pressable onPress={() => setActiveCollection(null)} style={[styles.chip, activeCollection === null && styles.chipActive]}>
        <Text style={[styles.chipText, activeCollection === null && styles.chipTextActive]}>All</Text>
      </Pressable>
      {collections.map((col) => (
        <Pressable key={col.id} onPress={() => setActiveCollection(activeCollection === col.id ? null : col.id)} style={[styles.chip, activeCollection === col.id && styles.chipActive]}>
          <Text style={[styles.chipText, activeCollection === col.id && styles.chipTextActive]}>{col.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const headingRow = (
    <View>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>My saved quotes</Text>
        <View style={styles.toggle}>
          <Pressable accessibilityRole="button" accessibilityLabel="Show all quotes" onPress={() => setViewMode('random')} style={[styles.toggleBtn, viewMode === 'random' && styles.toggleActive]}>
            <Ionicons name="shuffle" size={15} color={viewMode === 'random' ? colors.white : colors.mutedChocolate} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Group by author" onPress={() => setViewMode('author')} style={[styles.toggleBtn, viewMode === 'author' && styles.toggleActive]}>
            <Ionicons name="people" size={15} color={viewMode === 'author' ? colors.white : colors.mutedChocolate} />
          </Pressable>
        </View>
      </View>
      <TextInput
        accessibilityLabel="Search your quotes"
        value={search}
        onChangeText={setSearch}
        placeholder="Search your quotes"
        placeholderTextColor={colors.taupe}
        style={styles.search}
      />
      {/* Inside the shared header, so it is present in the empty-bank branch too —
          where writing your own is the most likely first action. Kept on the
          same row as the collection chips, right-aligned, so it reads as a
          toolbar for the chip row rather than a separate section. */}
      <View style={styles.chipsToolsRow}>
        {collectionChips}
        <View style={styles.toolRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Write your own quote" onPress={() => setComposing(true)} style={styles.toolBtn}>
            <Ionicons name="create-outline" size={13} color={colors.mutedChocolate} />
            <Text style={styles.toolBtnText}>Write your own</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Quote history" onPress={() => router.push('/history')} style={styles.toolBtn}>
            <Ionicons name="time-outline" size={13} color={colors.mutedChocolate} />
            <Text style={styles.toolBtnText}>History</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  const header = <View>{banner}{headingRow}</View>;

  // Reachable from either view, since both are filtered by the same collection
  // and search state.
  const emptyResults = (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{search.trim() ? 'No quotes match your search' : 'No quotes in this collection'}</Text>
      <Text style={styles.emptyText}>
        {search.trim() ? 'Try a different word, or clear the search.' : 'Tap the bookmark icon on any saved quote to add it here.'}
      </Text>
    </View>
  );

  // Deleting the last quote drops straight through to the empty state, so the
  // undo affordance has to outlive whichever branch rendered the trash icon.
  const body = quotes.length === 0 ? (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
      {header}
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Your quote bank is empty</Text>
        <Text style={styles.emptyText}>Explore authors and save the words you want to revisit.</Text>
      </View>
    </ScrollView>
  ) : viewMode === 'author' ? (
    <FlatList<AuthorGroup>
      style={styles.scroll}
      contentContainerStyle={styles.page}
      data={authorGroups}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      ListEmptyComponent={emptyResults}
      renderItem={({ item }) => (
        // Groups of the user's own quotes have no author page behind them, so they
        // render as a plain card rather than a Pressable that would dead-end on
        // "Author not found."
        // The testID identifies a group row specifically; the banner above renders
        // an author name too, so matching on the name alone is ambiguous.
        isCustomQuote({ authorId: item.id }) ? (
          <View testID={`author-group-${item.id}`} style={styles.authorCard}>
            <Text style={styles.authorCardName}>{item.authorName}</Text>
          </View>
        ) : (
          <Pressable testID={`author-group-${item.id}`} accessibilityRole="button" accessibilityLabel={`View quotes by ${item.authorName}`} style={styles.authorCard} onPress={() => router.push(`/authors/${item.id}`)}>
            {authorPhotos[item.id] ? <Image source={authorPhotos[item.id]} style={styles.authorCardPhoto} /> : null}
            <Text style={styles.authorCardName}>{item.authorName}</Text>
          </Pressable>
        )
      )}
    />
  ) : (
    <FlatList
      style={styles.scroll}
      contentContainerStyle={styles.page}
      data={filteredQuotes}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      ListEmptyComponent={emptyResults}
      renderItem={({ item }) => (
        <QuoteCard
          quote={item}
          onDelete={() => void removeQuote(item.id)}
          onTag={() => setTaggedQuote(item)}
          // Only the user's own words are editable; built-in text is canonical.
          onEdit={isCustomQuote(item) ? () => setEditing(item) : undefined}
        />
      )}
    />
  );

  return (
    <>
      {body}
      {lastRemoved ? (
        <View style={styles.undoBar}>
          <Text style={styles.undoText} numberOfLines={1}>Quote removed</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Undo delete" onPress={() => void undoRemove()} style={styles.undoBtn}>
            <Ionicons name="arrow-undo-outline" size={14} color={colors.gold} />
            <Text style={styles.undoAction}>Undo</Text>
          </Pressable>
        </View>
      ) : null}
      <ComposeQuoteModal
        visible={composing || editing !== null}
        quote={editing}
        onClose={() => { setComposing(false); setEditing(null); }}
        onSubmit={(text, attribution) => {
          // An edit keeps the id so collections and delivery history stay attached;
          // saveQuote appends and dedupes by id, so it would be a no-op here.
          if (editing) void updateCustomQuote(customQuoteWith(editing.id, text, attribution));
          else void saveQuote(makeCustomQuote(text, attribution));
        }}
      />
      <CollectionModal
        quote={taggedQuote}
        collections={collections}
        onClose={() => setTaggedQuote(null)}
        // CollectionModal only fires these while a quote is tagged, but that is
        // its contract to keep, not this component's to assume; a null check
        // here is a no-op rather than a crash if that ever changes.
        onAdd={(colId) => { if (taggedQuote) void addQuoteToCollection(taggedQuote.id, colId); }}
        onRemove={(colId) => { if (taggedQuote) void removeQuoteFromCollection(taggedQuote.id, colId); }}
        onNew={(name) => void addCollection(name)}
        onDelete={(colId) => { void deleteCollection(colId); if (activeCollection === colId) setActiveCollection(null); }}
      />
    </>
  );
}

function makeStyles(colors: Colors, scale: (n: number) => number) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.cream },
    page: { padding: 16 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
    banner: { backgroundColor: colors.chocolate, borderRadius: 20, padding: 22, shadowColor: colors.chocolate, shadowOpacity: .18, shadowRadius: 12, elevation: 4 },
    kicker: { fontWeight: '800', color: colors.gold, fontSize: scale(12), letterSpacing: 1.2 },
    // No fontWeight: Georgia has no semibold face, so '600' resolves to
    // Georgia-Bold — heavier than the SF Semibold it replaces. The serif carries
    // the emphasis on its own.
    bannerQuote: { fontFamily: QUOTE_FONT, color: colors.white, fontSize: scale(20), lineHeight: scale(29), marginTop: 9 },
    bannerAuthor: { color: colors.softCream, marginTop: 9, fontSize: scale(14) },
    moreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
    moreText: { color: colors.gold, fontWeight: '800', fontSize: scale(14) },
    authorPhoto: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.gold },
    shareRow: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4, marginBottom: 6 },
    shareText: { fontSize: scale(12), color: colors.mutedChocolate, fontWeight: '600' },
    bannerActions: { flexDirection: 'row', alignItems: 'center', gap: 16, alignSelf: 'flex-end', marginTop: 8, marginBottom: 6 },
    bannerActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 4 },
    headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 8 },
    heading: { fontSize: scale(22), fontWeight: '800', color: colors.chocolate },
    search: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 10, fontSize: scale(13), color: colors.chocolate },
    chipsToolsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    toolRow: { flexDirection: 'row', gap: 8, marginLeft: 8 },
    toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 11 },
    toolBtnText: { fontSize: scale(12), fontWeight: '700', color: colors.mutedChocolate },
    toggle: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 8, padding: 2, gap: 2 },
    toggleBtn: { padding: 6, borderRadius: 6 },
    toggleActive: { backgroundColor: colors.chocolate },
    chipsScroll: { flex: 1 },
    chipsContent: { flexDirection: 'row', gap: 7, paddingRight: 4 },
    chip: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.chocolate, borderColor: colors.chocolate },
    chipText: { fontSize: scale(12), fontWeight: '700', color: colors.mutedChocolate },
    chipTextActive: { color: colors.white },
    authorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, shadowColor: colors.chocolate, shadowOpacity: .08, shadowRadius: 6, elevation: 2, gap: 14 },
    authorCardPhoto: { width: 48, height: 48, borderRadius: 24 },
    authorCardName: { fontSize: scale(16), fontWeight: '700', color: colors.chocolate },
    empty: { alignItems: 'center', padding: 30, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    emptyTitle: { fontSize: scale(18), fontWeight: '800', color: colors.chocolate },
    emptyText: { color: colors.mutedChocolate, textAlign: 'center', marginTop: 8, lineHeight: scale(21), fontSize: scale(14) },
    undoBar: { position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.chocolate, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, shadowColor: colors.chocolate, shadowOpacity: .3, shadowRadius: 10, elevation: 6 },
    undoText: { color: colors.softCream, fontSize: scale(13), fontWeight: '600', flex: 1 },
    undoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingLeft: 12 },
    undoAction: { color: colors.gold, fontSize: scale(13), fontWeight: '800' },
  });
}
