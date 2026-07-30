import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { QUOTE_FONT } from '@/src/theme';
import type { Colors } from '@/src/theme';
import type { Collection, Quote } from '@/src/types';

interface Props {
  quote: Quote | null;
  collections: Collection[];
  onClose: () => void;
  onAdd: (collectionId: string) => void;
  onRemove: (collectionId: string) => void;
  onNew: (name: string) => void;
  onDelete: (collectionId: string) => void;
}

export function CollectionModal({ quote, collections, onClose, onAdd, onRemove, onNew, onDelete }: Props): ReactElement {
  const { colors, scale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  const [newName, setNewName] = useState('');

  const handleNew = (): void => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onNew(trimmed);
    setNewName('');
  };

  return (
    <Modal visible={quote !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet} testID="collection-sheet">
        <View style={styles.handle} />
        <Text style={styles.title}>Add to collection</Text>
        <Text style={styles.quotePrev} numberOfLines={2}>{quote ? `"${quote.text}"` : ''}</Text>

        {collections.length === 0 ? (
          <Text style={styles.empty}>No collections yet. Create one below.</Text>
        ) : (
          <FlatList
            data={collections}
            keyExtractor={(c) => c.id}
            style={styles.list}
            renderItem={({ item }) => {
              const active = quote ? item.quoteIds.includes(quote.id) : false;
              return (
                <View style={styles.row}>
                  <Pressable style={styles.rowMain} onPress={() => quote && (active ? onRemove(item.id) : onAdd(item.id))}>
                    <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={active ? colors.caramel : colors.border} />
                    <Text style={styles.rowName}>{item.name}</Text>
                  </Pressable>
                  <Pressable onPress={() => onDelete(item.id)} style={styles.deleteBtn} accessibilityLabel={`Delete ${item.name} collection`}>
                    <Ionicons name="trash-outline" size={15} color={colors.taupe} />
                  </Pressable>
                </View>
              );
            }}
          />
        )}

        <View style={styles.newRow}>
          <TextInput
            style={styles.newInput}
            placeholder="New collection name"
            placeholderTextColor={colors.taupe}
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleNew}
            returnKeyType="done"
          />
          <Pressable onPress={handleNew} style={[styles.newBtn, !newName.trim() && styles.newBtnDisabled]} disabled={!newName.trim()}>
            <Text style={styles.newBtnText}>Add</Text>
          </Pressable>
        </View>

        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function makeStyles(colors: Colors, scale: (n: number) => number) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36, maxHeight: '75%' },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
    title: { fontSize: scale(17), fontWeight: '800', color: colors.chocolate, marginBottom: 6 },
    quotePrev: { fontFamily: QUOTE_FONT, fontSize: scale(12), color: colors.mutedChocolate, lineHeight: scale(17), marginBottom: 16, fontStyle: 'italic' },
    empty: { fontSize: scale(13), color: colors.taupe, marginBottom: 16 },
    list: { maxHeight: 220, marginBottom: 16 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowName: { fontSize: scale(14), color: colors.chocolate, fontWeight: '600' },
    deleteBtn: { padding: 4 },
    newRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 14 },
    newInput: { flex: 1, backgroundColor: colors.softCream, borderWidth: 1, borderColor: colors.border, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8, fontSize: scale(13), color: colors.chocolate },
    newBtn: { backgroundColor: colors.caramel, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9 },
    newBtnDisabled: { opacity: 0.4 },
    newBtnText: { color: colors.white, fontWeight: '800', fontSize: scale(13) },
    closeBtn: { backgroundColor: colors.softCream, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
    closeBtnText: { fontSize: scale(14), fontWeight: '700', color: colors.chocolate },
  });
}
