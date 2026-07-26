import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { authorsData } from '@/src/data/authorsData';
import { colors } from '@/src/theme';

export default function AuthorsScreen(): JSX.Element {
  const [search, setSearch] = useState(''); const authors = useMemo(() => authorsData.filter((author) => author.name.toLowerCase().includes(search.toLowerCase())), [search]);
  return <View style={styles.page}><TextInput accessibilityLabel="Search authors" value={search} onChangeText={setSearch} placeholder="Search authors" placeholderTextColor={colors.taupe} style={styles.search} /><FlatList data={authors} keyExtractor={(author) => author.id} renderItem={({ item }) => <Pressable accessibilityRole="button" style={styles.row} onPress={() => router.push(`/authors/${item.id}`)}><Text style={styles.name}>{item.name}</Text><Text style={styles.bio} numberOfLines={2}>{item.bio}</Text></Pressable>} /></View>;
}
const styles = StyleSheet.create({ page: { flex: 1, padding: 16, backgroundColor: colors.cream }, search: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 16, color: colors.chocolate }, row: { backgroundColor: colors.white, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10 }, name: { fontSize: 18, fontWeight: '800', color: colors.chocolate }, bio: { marginTop: 7, color: colors.mutedChocolate, lineHeight: 20 } });
