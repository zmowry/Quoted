import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { authorById } from '@/src/data/authorsData';
import { authorPhotos } from '@/src/data/authorPhotos';
import { useQuoteBank } from '@/src/hooks/useQuoteBank';
import { useTheme } from '@/src/hooks/useTheme';
import type { Colors } from '@/src/theme';
import type { Quote } from '@/src/types';

function CopyButton({ text }: { text: string }): ReactElement {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const handleCopy = async (): Promise<void> => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Pressable onPress={() => void handleCopy()} accessibilityLabel="Copy quote" style={{ padding: 4 }}>
      <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={copied ? colors.caramel : colors.taupe} />
    </Pressable>
  );
}

export function AuthorDetail({ authorId }: { authorId: string }): ReactElement {
  const { colors, scale } = useTheme();
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  const author = authorById(authorId);
  const { quotes, saveQuote, removeQuote } = useQuoteBank();
  const goToAuthorsList = () => router.replace('/authors');
  if (!author) return (
    <View style={styles.page}>
      <Pressable accessibilityRole="button" onPress={goToAuthorsList} style={styles.backButton}><Text style={styles.backButtonText}>‹ All Authors</Text></Pressable>
      <Text style={styles.name}>Author not found.</Text>
    </View>
  );
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Pressable accessibilityRole="button" onPress={goToAuthorsList} style={styles.backButton}><Text style={styles.backButtonText}>‹ All Authors</Text></Pressable>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.name}>{author.name}</Text>
          <Text style={styles.bio}>{author.bio}</Text>
        </View>
        <View style={styles.photoSlot}>
          {authorPhotos[author.id]
            ? <Image source={authorPhotos[author.id]} style={styles.photo} />
            : <View style={[styles.photo, styles.photoPlaceholder]}><Text style={styles.photoInitial}>{author.name.charAt(0)}</Text></View>}
        </View>
      </View>
      {author.quotes.map((rawQuote) => {
        const quote: Quote = { ...rawQuote, authorName: author.name };
        const saved = quotes.some((item) => item.id === quote.id);
        return (
          <View key={quote.id} style={styles.quoteCard}>
            <View style={styles.quoteRow}>
              <Text style={[styles.quote, { flex: 1 }]}>"{quote.text}"</Text>
              <CopyButton text={quote.text} />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={saved ? `Remove ${quote.text}` : `Save ${quote.text}`} style={[styles.save, saved && styles.remove]} onPress={() => void (saved ? removeQuote(quote.id) : saveQuote(quote))}>
              <Text style={styles.saveText}>{saved ? 'Remove from My Bank' : '+ Save to My Bank'}</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

export default function AuthorDetailScreen(): ReactElement {
  const { authorId } = useLocalSearchParams<{ authorId: string }>();
  return <AuthorDetail authorId={authorId} />;
}

function makeStyles(colors: Colors, scale: (n: number) => number) {
  return StyleSheet.create({
    page: { padding: 20, backgroundColor: colors.cream, flexGrow: 1 },
    backButton: { alignSelf: 'flex-start', marginBottom: 16, paddingVertical: 6, paddingHorizontal: 4 },
    backButtonText: { color: colors.burntCaramel, fontWeight: '800', fontSize: scale(15) },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
    headerText: { flex: 1, paddingRight: 16 },
    name: { fontSize: scale(29), fontWeight: '800', color: colors.chocolate },
    bio: { marginTop: 10, fontSize: scale(16), lineHeight: scale(23), color: colors.mutedChocolate },
    photoSlot: { width: 84, height: 84 },
    photo: { width: 84, height: 84, borderRadius: 42 },
    photoPlaceholder: { backgroundColor: colors.taupe, alignItems: 'center', justifyContent: 'center' },
    photoInitial: { color: colors.white, fontSize: scale(28), fontWeight: '800' },
    quoteCard: { backgroundColor: colors.white, borderRadius: 12, borderColor: colors.border, borderWidth: 1, padding: 12, marginBottom: 10 },
    quoteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    quote: { fontSize: scale(14), lineHeight: scale(20), color: colors.chocolate },
    save: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: colors.caramel, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
    remove: { backgroundColor: colors.burntCaramel },
    saveText: { color: colors.white, fontWeight: '800', fontSize: scale(11) },
  });
}
