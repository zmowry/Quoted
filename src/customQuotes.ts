import type { ThemeId } from '@/src/data/themes';
import type { Quote } from '@/src/types';

/**
 * Quotes the user wrote themselves.
 *
 * They live in the same `@quote-bank/quotes` array as saved built-ins, which is
 * the whole point of the design: rotation, notifications, collections, search,
 * share, undo, and delivery history all work on them with no new plumbing and no
 * new storage key.
 *
 * A custom quote is marked by a `custom:` prefix on its `authorId`, and
 * `isCustomQuote` derives from that rather than a separate flag. A boolean field
 * would be a second, independently-settable source of truth — `{ isCustom: true,
 * authorId: 'einstein' }` type-checks and would render a live link to Einstein
 * from a quote the app calls custom. One derived marker cannot disagree with
 * itself.
 */

export const CUSTOM_AUTHOR_PREFIX = 'custom:';
/** Stands in when the user leaves the attribution blank. */
export const DEFAULT_ATTRIBUTION = 'Anonymous';
export const MAX_QUOTE_LENGTH = 280;
export const MAX_ATTRIBUTION_LENGTH = 60;

const uid = (): string => Math.random().toString(36).slice(2);

/**
 * Lower-cased with punctuation collapsed to single hyphens.
 *
 * Consequence worth knowing: attributions that slug identically ("J. Smith" and
 * "J Smith") share an author group, which shows the first-seen spelling while
 * each card still renders its own `authorName`. That is typo tolerance, not a bug.
 */
export const slugAttribution = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const isCustomQuote = (quote: Pick<Quote, 'authorId'>): boolean =>
  quote.authorId.startsWith(CUSTOM_AUTHOR_PREFIX);

/** Same attribution gives the same id, so author grouping collects them in one row. */
export const customAuthorId = (attribution: string): string => CUSTOM_AUTHOR_PREFIX + slugAttribution(attribution);

/**
 * Normalises the pair, keeping `authorName` and `authorId` in step.
 *
 * The blank check runs on the *slug*, so an attribution of `"???"` — which trims
 * to something non-empty but slugs to nothing — falls back too. Replacing the
 * attribution itself rather than just the id is what stops a card displaying
 * `???` while grouped under a bare `custom:`.
 */
export const customQuoteFields = (text: string, attribution: string, themes: ThemeId[] = []): Pick<Quote, 'text' | 'authorId' | 'authorName' | 'themes'> => {
  const trimmed = attribution.trim().slice(0, MAX_ATTRIBUTION_LENGTH);
  const authorName = slugAttribution(trimmed) ? trimmed : DEFAULT_ATTRIBUTION;
  return {
    text: text.trim().slice(0, MAX_QUOTE_LENGTH),
    authorName,
    authorId: customAuthorId(authorName),
    // Omitted entirely when empty rather than stored as `[]`, so an untagged
    // quote is shaped exactly like one written before themes existed and no
    // migration is needed to tell the two apart.
    ...(themes.length ? { themes: [...new Set(themes)] } : {}),
  };
};

export const makeCustomQuote = (text: string, attribution: string, themes: ThemeId[] = []): Quote =>
  ({ id: `custom-${uid()}`, ...customQuoteFields(text, attribution, themes) });

/**
 * An edit keeps the original id, so the quote stays attached to its collections
 * and to the days it has already been delivered on.
 *
 * Themes are rebuilt from the argument rather than merged into what was stored,
 * so clearing the last one off a quote actually clears it — `updateQuote`
 * replaces the whole record, and the key is simply absent again.
 */
export const customQuoteWith = (id: string, text: string, attribution: string, themes: ThemeId[] = []): Quote =>
  ({ id, ...customQuoteFields(text, attribution, themes) });
