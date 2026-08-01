import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { MAX_ATTRIBUTION_LENGTH, MAX_QUOTE_LENGTH } from '@/src/customQuotes';
import { THEMES } from '@/src/data/themes';
import type { ThemeId } from '@/src/data/themes';
import { QUOTE_FONT } from '@/src/theme';
import type { Colors } from '@/src/theme';
import type { Quote } from '@/src/types';

interface Props {
  visible: boolean;
  /** The quote being edited, or null when writing a new one. */
  quote: Quote | null;
  onClose: () => void;
  onSubmit: (text: string, attribution: string, themes: ThemeId[]) => void;
}

export function ComposeQuoteModal({ visible, quote, onClose, onSubmit }: Props): ReactElement {
  const { colors, scale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  const [text, setText] = useState('');
  const [attribution, setAttribution] = useState('');
  const [themes, setThemes] = useState<ThemeId[]>([]);
  // Collapsed by default: the grid is 21 chips, and most quotes are written and
  // saved without tagging. Opening it is the opt-in.
  const [pickingThemes, setPickingThemes] = useState(false);

  // Seeded from the quote under edit, and cleared when the sheet closes so a
  // cancelled edit does not leak into the next compose.
  useEffect(() => {
    if (!visible) { setText(''); setAttribution(''); setThemes([]); setPickingThemes(false); return; }
    setText(quote?.text ?? '');
    setAttribution(quote?.authorName ?? '');
    setThemes(quote?.themes ?? []);
    // Opened straight away when editing something already tagged, so the
    // existing themes are visible rather than hidden behind a closed header the
    // user has to think to open.
    setPickingThemes(!!quote?.themes?.length);
  }, [visible, quote]);

  const toggleTheme = (id: ThemeId): void =>
    setThemes((prev) => prev.includes(id) ? prev.filter((theme) => theme !== id) : [...prev, id]);

  const ready = text.trim().length > 0;

  const submit = (): void => {
    if (!ready) return;
    onSubmit(text, attribution, themes);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      {/* A multiline field in a bottom sheet is materially more exposed to
          keyboard occlusion than a single-line one. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet} testID="compose-sheet">
          <View style={styles.handle} />
          <Text style={styles.title}>{quote ? 'Edit your quote' : 'Write your own quote'}</Text>

          <TextInput
            accessibilityLabel="Quote text"
            style={styles.textInput}
            placeholder="What do you want to remember?"
            placeholderTextColor={colors.taupe}
            value={text}
            // Capped here as well as via maxLength: fireEvent.changeText bypasses
            // the native prop, so a cap that exists only as a prop is not one the
            // test suite can prove.
            onChangeText={(value) => setText(value.slice(0, MAX_QUOTE_LENGTH))}
            maxLength={MAX_QUOTE_LENGTH}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{text.trim().length}/{MAX_QUOTE_LENGTH}</Text>

          <TextInput
            accessibilityLabel="Who said it"
            style={styles.attributionInput}
            placeholder="Who said it (optional)"
            placeholderTextColor={colors.taupe}
            value={attribution}
            onChangeText={(value) => setAttribution(value.slice(0, MAX_ATTRIBUTION_LENGTH))}
            maxLength={MAX_ATTRIBUTION_LENGTH}
            returnKeyType="done"
            onSubmitEditing={submit}
          />

          {/* Themes are what let a quote you wrote reach the bank's theme filter
              and a theme-scoped delivery. Without them a custom quote inherits
              nothing, since a `custom:` authorId has no author behind it. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={pickingThemes ? 'Hide themes' : 'Add themes'}
            accessibilityState={{ expanded: pickingThemes }}
            onPress={() => setPickingThemes((open) => !open)}
            style={styles.themeToggle}
          >
            <Text style={styles.themeToggleText}>
              {themes.length ? `Themes (${themes.length})` : 'Add themes'}
            </Text>
            <Text style={styles.themeToggleChevron}>{pickingThemes ? '–' : '+'}</Text>
          </Pressable>
          {pickingThemes ? (
            <ScrollView style={styles.themeGrid} contentContainerStyle={styles.themeGridContent} keyboardShouldPersistTaps="handled">
              {THEMES.map(({ id, label }) => {
                const active = themes.includes(id);
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
          ) : null}

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={submit} style={[styles.saveBtn, !ready && styles.saveBtnDisabled]} disabled={!ready}>
              <Text style={styles.saveBtnText}>{quote ? 'Save changes' : 'Add to my bank'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(colors: Colors, scale: (n: number) => number) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
    title: { fontSize: scale(17), fontWeight: '800', color: colors.chocolate, marginBottom: 14 },
    textInput: { fontFamily: QUOTE_FONT, minHeight: 96, backgroundColor: colors.softCream, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: scale(14), lineHeight: scale(20), color: colors.chocolate },
    counter: { alignSelf: 'flex-end', marginTop: 5, fontSize: scale(11), color: colors.taupe, fontWeight: '600' },
    attributionInput: { marginTop: 10, backgroundColor: colors.softCream, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: scale(13), color: colors.chocolate },
    themeToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingVertical: 8 },
    themeToggleText: { fontSize: scale(13), fontWeight: '700', color: colors.chocolate },
    themeToggleChevron: { fontSize: scale(16), fontWeight: '800', color: colors.mutedChocolate, paddingHorizontal: 6 },
    // Capped and scrollable: the full vocabulary wraps to several rows, which
    // would push the buttons under the keyboard on a smaller phone.
    themeGrid: { maxHeight: 132, marginBottom: 4 },
    themeGridContent: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 4 },
    themeChip: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20, backgroundColor: colors.softCream, borderWidth: 1, borderColor: colors.border },
    themeChipActive: { backgroundColor: colors.caramel, borderColor: colors.caramel },
    themeChipText: { fontSize: scale(11), fontWeight: '700', color: colors.mutedChocolate },
    themeChipTextActive: { color: colors.white },
    actions: { flexDirection: 'row', gap: 8, marginTop: 18 },
    cancelBtn: { flex: 1, backgroundColor: colors.softCream, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
    cancelBtnText: { fontSize: scale(14), fontWeight: '700', color: colors.chocolate },
    saveBtn: { flex: 2, backgroundColor: colors.caramel, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { fontSize: scale(14), fontWeight: '800', color: colors.white },
  });
}
