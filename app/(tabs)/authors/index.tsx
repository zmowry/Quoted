import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { authorsData } from '@/src/data/authorsData';
import { authorPhotos } from '@/src/data/authorPhotos';
import { useTheme } from '@/src/hooks/useTheme';
import type { Colors } from '@/src/theme';

type SortMode = 'last' | 'first';

function lastName(name: string): string { const parts = name.trim().split(' '); return parts[parts.length - 1]; }
function firstName(name: string): string { return name.trim().split(' ')[0]; }

export default function AuthorsScreen(): JSX.Element {
  const { colors, scale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('last');

  const authors = useMemo(() => {
    const filtered = authorsData.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
    const key = sortMode === 'last' ? lastName : firstName;
    return [...filtered].sort((a, b) => key(a.name).localeCompare(key(b.name)));
  }, [search, sortMode]);

  return (
    <View style={styles.page}>
      <TextInput
        accessibilityLabel="Search authors"
        value={search}
        onChangeText={setSearch}
        placeholder="Search authors"
        placeholderTextColor={colors.taupe}
        style={styles.search}
      />
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
        data={authors}
        keyExtractor={(author) => author.id}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" style={styles.row} onPress={() => router.push(`/authors/${item.id}`)}>
            <View style={styles.textCol}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
            </View>
            <View style={styles.photoSlot}>
              {authorPhotos[item.id]
                ? <Image source={authorPhotos[item.id]} style={styles.photo} />
                : <View style={[styles.photo, styles.photoPlaceholder]}><Text style={styles.photoInitial}>{item.name.charAt(0)}</Text></View>}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function makeStyles(colors: Colors, scale: (n: number) => number) {
  return StyleSheet.create({
    page: { flex: 1, padding: 16, backgroundColor: colors.cream },
    search: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10, fontSize: scale(16), color: colors.chocolate },
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
  });
}
