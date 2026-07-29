import type { Quote } from '@/src/types';

/**
 * The canonical plain-text rendering of a quote, used wherever it leaves the app
 * as text: the clipboard and notification bodies.
 *
 * Straight quotes rather than typographic ones, since this lands in whatever the
 * user pastes into and should survive plain-text destinations unchanged.
 */
export const quoteWithAttribution = (quote: Pick<Quote, 'text' | 'authorName'>): string =>
  `"${quote.text}" -- ${quote.authorName}`;
