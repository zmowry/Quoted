import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { authorsData } from '@/src/data/authorsData';

export default function ExploreScreen(): JSX.Element {
  const [search, setSearch] = useState(''); const authors = useMemo(() => authorsData.filter((author) => author.name.toLowerCase().includes(search.toLowerCase())), [search]);
  return <View style={styles.page}><TextInput accessibilityLabel="Search authors" value={search} onChangeText={setSearch} placeholder="Search authors" style={styles.search} /><FlatList data={authors} keyExtractor={(author) => author.id} renderItem={({ item }) => <Pressable accessibilityRole="button" style={styles.row} onPress={() => router.push(`/explore/${item.id}`)}><Text style={styles.name}>{item.name}</Text><Text style={styles.bio} numberOfLines={2}>{item.bio}</Text></Pressable>} /></View>;
}
const styles = StyleSheet.create({ page: { flex: 1, padding: 16, backgroundColor: '#f5f7fa' }, search: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 16 }, row: { backgroundColor: '#fff', padding: 18, borderRadius: 14, marginBottom: 10 }, name: { fontSize: 18, fontWeight: '800', color: '#263238' }, bio: { marginTop: 7, color: '#607d8b', lineHeight: 20 } });
