import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren, ReactElement } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { shareAsync } from 'expo-sharing';
import { QUOTE_FONT, lightColors } from '@/src/theme';
import type { Quote } from '@/src/types';

/**
 * Sharing a quote as an image, from anywhere a quote is rendered.
 *
 * The capture surface is a single off-screen card owned by this provider rather
 * than a hidden view inside each `QuoteCard`: the bank renders a list, and one
 * hidden, `collapsable={false}` copy per row would mean dozens of real native
 * views laid out purely so one of them might be photographed.
 *
 * It also decouples the image from the on-screen card, which is the point — the
 * card carries delete and edit affordances that have no business in a picture
 * someone sends to a friend.
 */

interface QuoteShareValue {
  /** The quote currently being captured, if any; drives per-card pending state. */
  sharingId?: string;
  shareQuote: (quote: Quote) => void;
}

const QuoteShareContext = createContext<QuoteShareValue | undefined>(undefined);

/** Fixed so the image is the same size regardless of the device it came from. */
const CARD_WIDTH = 340;

export function QuoteShareProvider({ children }: PropsWithChildren): ReactElement {
  const [pending, setPending] = useState<Quote | null>(null);
  const cardRef = useRef<View>(null);

  const shareQuote = useCallback((quote: Quote) => {
    // Ignored rather than queued while a capture is in flight: the card is a
    // single surface, so starting a second would photograph the wrong quote.
    setPending((current) => current ?? quote);
  }, []);

  useEffect(() => {
    if (!pending) return;
    let cancelled = false;
    void (async () => {
      try {
        // Yields once so React commits the card and the native view lays out;
        // capturing in the same tick photographs a zero-sized view.
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (cancelled || !cardRef.current) return;
        const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
        await shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share this quote' });
      } catch {
        Alert.alert('Could not share', 'Something went wrong preparing the quote image. Please try again.');
      } finally {
        if (!cancelled) setPending(null);
      }
    })();
    return () => { cancelled = true; };
  }, [pending]);

  return (
    <QuoteShareContext.Provider value={{ sharingId: pending?.id, shareQuote }}>
      {children}
      {/* Mounted only mid-capture. Kept out of the tree the rest of the time so
          the quote text is not duplicated for screen readers or for anything
          else walking the view hierarchy. */}
      {pending ? (
        <View
          ref={cardRef}
          collapsable={false}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.stage}
        >
          <Text style={styles.quote}>&ldquo;{pending.text}&rdquo;</Text>
          <Text style={styles.author}>{pending.authorName}</Text>
          <View style={styles.rule} />
          <Text style={styles.wordmark}>QUOTED</Text>
        </View>
      ) : null}
    </QuoteShareContext.Provider>
  );
}

export function useQuoteShare(): QuoteShareValue {
  const context = useContext(QuoteShareContext);
  if (!context) throw new Error('useQuoteShare must be used within QuoteShareProvider');
  return context;
}

/**
 * Deliberately the light palette and a fixed type scale, not the user's theme.
 *
 * The image leaves the device, so it should look the same whoever made it —
 * a dark-mode reader's screenshot has no reason to arrive dark, and someone
 * running the largest text size has no reason to send a differently-proportioned
 * card than everyone else.
 */
const styles = StyleSheet.create({
  stage: {
    position: 'absolute',
    // Parked off-screen rather than hidden with opacity, which would capture as
    // transparent. It stays laid out and therefore capturable.
    left: -CARD_WIDTH * 2,
    top: 0,
    width: CARD_WIDTH,
    paddingHorizontal: 28,
    paddingVertical: 32,
    backgroundColor: lightColors.cream,
  },
  quote: { fontFamily: QUOTE_FONT, fontSize: 20, lineHeight: 30, color: lightColors.chocolate },
  author: { marginTop: 18, fontSize: 14, fontWeight: '700', color: lightColors.burntCaramel },
  rule: { marginTop: 22, height: 1, backgroundColor: lightColors.border },
  wordmark: { marginTop: 12, fontSize: 10, fontWeight: '800', letterSpacing: 2.4, color: lightColors.taupe },
});
