import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { QuoteCard } from '@/src/components/QuoteCard';
import { authorsData } from '@/src/data/authorsData';
import { THEMES, themeLabel } from '@/src/data/themes';
import type { ThemeId } from '@/src/data/themes';
import { authorPhotos } from '@/src/data/authorPhotos';
import { useQuoteBank } from '@/src/hooks/useQuoteBank';
import { useTheme } from '@/src/hooks/useTheme';
import { QUOTE_FONT, measure } from '@/src/theme';
import type { Colors } from '@/src/theme';
import type { Author, Quote } from '@/src/types';

type SortMode = 'last' | 'first';

type ResultRow =
  | { kind: 'author'; author: Author }
  | { kind: 'header'; label: string }
  | { kind: 'quote'; quote: Quote };

function lastName(name: string): string { const parts = name.trim().split(' '); return parts[parts.length - 1]; }
function firstName(name: string): string { return name.trim().split(' ')[0]; }

export default function AuthorsScreen(): ReactElement {
  const { colors, scale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  const { quotes, saveQuote, removeQuote } = useQuoteBank();
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('last');
  const [activeThemes, setActiveThemes] = useState<ThemeId[]>([]);
  const [surprise, setSurprise] = useState<Quote | null>(null);

  const toggleTheme = (id: ThemeId): void =>
    setActiveThemes((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);

  const allQuotes = useMemo<Quote[]>(
    () => authorsData.flatMap((a) => a.quotes.map((q): Quote => ({ ...q, authorName: a.name }))),
    [],
  );

  // Selecting more chips narrows rather than widens, so an author must carry
  // *every* chosen theme. With 5-7 themes each that keeps a pair like
  // stoicism + resilience meaningful instead of returning most of the list.
  const themed = useMemo(
    () => activeThemes.length
      ? authorsData.filter((a) => activeThemes.every((t) => a.themes.includes(t)))
      : authorsData,
    [activeThemes],
  );

  // Respects the theme filter: rolling a quote from an author the user has just
  // filtered out would read as the chips being ignored.
  const rollPool = useMemo<Quote[]>(
    () => themed.flatMap((a) => a.quotes.map((q): Quote => ({ ...q, authorName: a.name }))),
    [themed],
  );

  // Drawing from everything except what is already showing: a re-roll that lands
  // on the same quote reads as the button being broken.
  const roll = (): void => {
    const pool = surprise ? rollPool.filter((q) => q.id !== surprise.id) : rollPool;
    if (!pool.length) return;
    setSurprise(pool[Math.floor(Math.random() * pool.length)]);
  };

  const surpriseSaved = surprise ? quotes.some((q) => q.id === surprise.id) : false;

  const authors = useMemo(() => {
    // Themes match the search box too, so typing "stoicism" finds Seneca even
    // though the word appears in neither his name nor his bio.
    const query = search.trim().toLowerCase();
    const filtered = themed.filter((a) => !query
      || a.name.toLowerCase().includes(query)
      || a.themes.some((t) => themeLabel(t).toLowerCase().includes(query)));
    const key = sortMode === 'last' ? lastName : firstName;
    return [...filtered].sort((a, b) => key(a.name).localeCompare(key(b.name)));
  }, [themed, search, sortMode]);

  // Authors whose name already matched get their own row above, so a quote of
  // theirs would be redundant here — this section is only for the author you
  // would not have found by browsing name matches alone.
  const quoteMatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    const matchedIds = new Set(authors.map((a) => a.id));
    // `themed`, not `authorsData`: a quote from an author the theme chips have
    // excluded must not reappear here through the search.
    return themed
      .filter((a) => !matchedIds.has(a.id))
      .flatMap((a) => a.quotes
        .filter((q) => q.text.toLowerCase().includes(query))
        .map((q): Quote => ({ ...q, authorName: a.name })));
  }, [search, authors, themed]);

  const rows = useMemo<ResultRow[]>(() => {
    const authorRows: ResultRow[] = authors.map((author) => ({ kind: 'author', author }));
    if (!quoteMatches.length) return authorRows;
    return [...authorRows, { kind: 'header', label: 'Matching quotes' }, ...quoteMatches.map((quote): ResultRow => ({ kind: 'quote', quote }))];
  }, [authors, quoteMatches]);

  return (
    // Two views rather than one: the outer paints the background edge to edge,
    // the inner holds the content to a readable measure on iPad.
    <View style={styles.screen}>
    <View style={styles.page}>
      <TextInput
        accessibilityLabel="Search authors"
        value={search}
        onChangeText={setSearch}
        placeholder="Search authors or quotes"
        placeholderTextColor={colors.taupe}
        style={styles.search}
      />
      <View style={styles.themeHeader}>
        <Text style={styles.sortLabel}>Themes</Text>
        {activeThemes.length ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear theme filters" onPress={() => setActiveThemes([])} style={styles.clearThemes}>
            <Text style={styles.clearThemesText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="theme-chips" style={styles.themeScroll} contentContainerStyle={styles.themeContent}>
        {THEMES.map(({ id, label }) => {
          const active = activeThemes.includes(id);
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Theme ${label}`}
              onPress={() => toggleTheme(id)}
              style={[styles.themeChip, active && styles.themeChipActive]}
            >
              <Text style={[styles.themeChipText, active && styles.themeChipTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable accessibilityRole="button" accessibilityLabel="Surprise me" onPress={roll} style={styles.surpriseBtn}>
        <Ionicons name="sparkles" size={13} color={colors.gold} />
        <Text style={styles.surpriseBtnText}>Surprise me</Text>
      </Pressable>
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by</Text>
        <View style={styles.toggle}>
          <Pressable onPress={() => setSortMode('last')} style={[styles.toggleBtn, sortMode === 'last' && styles.toggleActive]}>
            <Text style={[styles.toggleText, sortMode === 'last' && styles.toggleTextActive]}>Last Name</Text>
          </Pressable>
          <Pressable onPress={() => setSortMode('first')} style={[styles.toggleBtn, sortMode === 'first' && styles.toggleActive]}>
            <Text style={[styles.toggleText, sortMode === 'first' && styles.toggleTextActive]}>First Name</Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.kind === 'author' ? row.author.id : row.kind === 'header' ? row.label : row.quote.id}
        ListEmptyComponent={(
          <Text style={styles.emptyText}>
            {activeThemes.length
              ? `No author covers ${activeThemes.map(themeLabel).join(' + ')}. Try removing a theme.`
              : 'No authors match your search.'}
          </Text>
        )}
        ListHeaderComponent={surprise ? (
          <View style={styles.surpriseCard}>
            <QuoteCard quote={surprise} />
            <View style={styles.surpriseActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={surpriseSaved ? `Remove ${surprise.text}` : `Save ${surprise.text}`}
                onPress={() => void (surpriseSaved ? removeQuote(surprise.id) : saveQuote(surprise))}
                style={styles.surpriseAction}
              >
                <Text style={styles.surpriseActionText}>{surpriseSaved ? '- Remove' : '+ Save'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Dismiss surprise quote" onPress={() => setSurprise(null)} style={styles.surpriseAction}>
                <Text style={styles.surpriseActionText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        renderItem={({ item }) => {
          if (item.kind === 'header') return <Text style={styles.sectionHeader}>{item.label}</Text>;
          if (item.kind === 'quote') {
            const { quote } = item;
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={`View quotes by ${quote.authorName}`} style={styles.quoteRow} onPress={() => router.push(`/authors/${quote.authorId}`)}>
                <Text style={styles.quoteText} numberOfLines={3}>&ldquo;{quote.text}&rdquo;</Text>
                <Text style={styles.quoteAuthor}>-- {quote.authorName}</Text>
              </Pressable>
            );
          }
          const { author } = item;
          return (
            <Pressable accessibilityRole="button" style={styles.row} onPress={() => router.push(`/authors/${author.id}`)}>
              <View style={styles.textCol}>
                <Text style={styles.name}>{author.name}</Text>
                <Text style={styles.bio} numberOfLines={1}>{author.bio}</Text>
              </View>
              <View style={styles.photoSlot}>
                {authorPhotos[author.id]
                  ? <Image source={authorPhotos[author.id]} style={styles.photo} />
                  : <View style={[styles.photo, styles.photoPlaceholder]}><Text style={styles.photoInitial}>{author.name.charAt(0)}</Text></View>}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
    </View>
  );
}

function makeStyles(colors: Colors, scale: (n: number) => number) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    page: { flex: 1, padding: 16, ...measure },
    search: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10, fontSize: scale(16), color: colors.chocolate },
    themeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
    clearThemes: { paddingVertical: 2, paddingHorizontal: 6 },
    clearThemesText: { fontSize: scale(12), fontWeight: '700', color: colors.burntCaramel },
    // ScrollView's own base style is flexGrow: 1, flexShrink: 1. Overriding only
    // the grow left the shrink in place, so the author list below squeezed this
    // row and cut every chip off halfway. Both have to be pinned: the row sizes
    // to its content and scrolls horizontally within that height.
    themeScroll: { flexGrow: 0, flexShrink: 0, marginBottom: 12 },
    themeContent: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingRight: 4 },
    themeChip: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
    themeChipActive: { backgroundColor: colors.caramel, borderColor: colors.caramel },
    themeChipText: { fontSize: scale(12), fontWeight: '700', color: colors.mutedChocolate },
    themeChipTextActive: { color: colors.white },
    surpriseBtn: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 5, backgroundColor: colors.chocolate, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 12 },
    surpriseBtnText: { color: colors.white, fontSize: scale(12), fontWeight: '800' },
    surpriseCard: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    surpriseActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    surpriseAction: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
    surpriseActionText: { fontSize: scale(12), fontWeight: '700', color: colors.mutedChocolate },
    sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    sortLabel: { fontSize: scale(14), fontWeight: '700', color: colors.mutedChocolate },
    toggle: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 8, padding: 2, gap: 2 },
    toggleBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
    toggleActive: { backgroundColor: colors.chocolate },
    toggleText: { fontSize: scale(13), fontWeight: '700', color: colors.mutedChocolate },
    toggleTextActive: { color: colors.white },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
    textCol: { flex: 1, paddingRight: 10 },
    name: { fontSize: scale(15), fontWeight: '800', color: colors.chocolate },
    bio: { marginTop: 3, color: colors.mutedChocolate, lineHeight: scale(17), fontSize: scale(12) },
    photoSlot: { width: 44, height: 44 },
    photo: { width: 44, height: 44, borderRadius: 22 },
    photoPlaceholder: { backgroundColor: colors.taupe, alignItems: 'center', justifyContent: 'center' },
    photoInitial: { color: colors.white, fontSize: scale(16), fontWeight: '800' },
    emptyText: { fontSize: scale(14), color: colors.mutedChocolate, textAlign: 'center', lineHeight: scale(21), marginTop: 24, paddingHorizontal: 20 },
    sectionHeader: { fontSize: scale(12), fontWeight: '800', color: colors.mutedChocolate, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 6, marginBottom: 8 },
    quoteRow: { backgroundColor: colors.white, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
    // fontFamily + fontStyle resolves the real Georgia-Italic face through iOS
    // trait matching rather than synthesising a slant.
    quoteText: { fontFamily: QUOTE_FONT, fontSize: scale(14), lineHeight: scale(20), color: colors.chocolate, fontStyle: 'italic' },
    quoteAuthor: { marginTop: 6, fontSize: scale(12), fontWeight: '700', color: colors.burntCaramel },
  });
}
