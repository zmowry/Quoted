import type { ThemeId } from '@/src/data/themes';
import type { ScheduleCoverage } from '@/src/services/notifications';

/**
 * `themes` is set only on quotes the user wrote. A built-in quote leaves it
 * undefined and inherits its author's themes instead — see `themesForQuote`,
 * which is the only thing that should read this field directly.
 */
export interface Quote { id: string; text: string; authorId: string; authorName: string; themes?: ThemeId[]; }
/**
 * Themes are tagged per author rather than per quote: an author's body of work
 * has a recognisable set of preoccupations, and 240 individually-tagged quotes
 * would be a judgement call each rather than a fact about the writer. A quote
 * inherits its author's themes, which is what `themesForQuote` reads.
 */
export interface Author { id: string; name: string; bio: string; themes: ThemeId[]; photoUrl?: string; quotes: Omit<Quote, 'authorName'>[]; }
export interface QueueState { shownIds: string[]; }
/**
 * Which quote belongs to which calendar day, keyed `YYYY-MM-DD` in local time.
 *
 * Without this the cycle advances on every app launch, so re-opening the app
 * burns through quotes and leaves the banner disagreeing with the notification
 * that is already pending in the OS.
 */
export type DailyAssignments = Record<string, string>;
/**
 * One day of the rotation: the calendar day, the quote its daily notification
 * delivers, and the quotes for any extra notifications that day. Every slot is
 * drawn from the same cycle, so the no-repeat guarantee covers all of them.
 */
export interface PlannedDay { day: Date; quote?: Quote; extras: Quote[]; }
export interface NotificationTime { hour: number; minute: number; }
/**
 * `times` and `scopes` are both indexed by slot, so slot i is the extra
 * notification that fires at `times[i]` carrying a quote from `scopes[i]`.
 * Only the first `count` entries of each are in use; the rest are remembered so
 * turning the count back up restores what was there before.
 *
 * A `null` scope means "follow the daily delivery scope" rather than "the whole
 * bank": a slot left alone keeps tracking the main setting instead of quietly
 * disagreeing with it the moment that is narrowed. That is why this is
 * `DeliveryScope | null` rather than folding the idea into a fourth variant —
 * "same as daily" is a statement about the setting, not about a set of quotes.
 */
export interface AdditionalQuotesSettings { enabled: boolean; count: number; times: NotificationTime[]; scopes: (DeliveryScope | null)[]; }
export interface Collection { id: string; name: string; quoteIds: string[]; }

/**
 * What the rotation is allowed to draw from.
 *
 * A discriminated union rather than a nullable collection id, which is what this
 * was when a collection was the only way to narrow delivery. The variants are
 * genuinely different kinds of thing — a collection is something you filed a
 * quote into, a theme is something the quote already is — and flattening both
 * into one id field would leave nothing to say which table to look it up in.
 *
 * `deliveryPool` is the single place that resolves a scope to quotes, so adding
 * a variant means teaching one function rather than every call site.
 */
export type DeliveryScope =
  | { kind: 'all' }
  | { kind: 'collection'; id: string }
  | { kind: 'theme'; id: ThemeId };

export const ALL_QUOTES: DeliveryScope = { kind: 'all' };

/** Structural equality, so the UI can mark the selected row without identity games. */
export const sameScope = (a: DeliveryScope, b: DeliveryScope): boolean =>
  a.kind === b.kind && (a.kind === 'all' || b.kind === 'all' || a.id === b.id);
/** How the daily rotation picks the next quote from the unseen pool. */
export type QuoteOrder = 'sequential' | 'shuffle';
export interface QuoteBankContextValue { quotes: Quote[]; quoteOfDay?: Quote; notificationTime: NotificationTime; additionalQuotes: AdditionalQuotesSettings; collections: Collection[]; loading: boolean; saveQuote: (quote: Quote) => Promise<void>; updateCustomQuote: (quote: Quote) => Promise<void>; removeQuote: (id: string) => Promise<void>; lastRemoved?: Quote; undoRemove: () => Promise<void>; refreshQuoteOfDay: () => Promise<void>; updateNotificationTime: (time: NotificationTime) => Promise<void>; updateAdditionalQuotes: (settings: AdditionalQuotesSettings) => Promise<void>; addCollection: (name: string) => Promise<Collection>; deleteCollection: (id: string) => Promise<void>; addQuoteToCollection: (quoteId: string, collectionId: string) => Promise<void>; removeQuoteFromCollection: (quoteId: string, collectionId: string) => Promise<void>; clearAllData: () => Promise<void>; quoteOrder: QuoteOrder; updateQuoteOrder: (order: QuoteOrder) => Promise<void>; soundEnabled: boolean; updateSoundEnabled: (enabled: boolean) => Promise<void>; deliveryScope: DeliveryScope; updateDeliveryScope: (scope: DeliveryScope) => Promise<void>; deliveryPool: Quote[]; /** One pool per active extra slot, so settings can report each slot's real size. */ extraPools: Quote[][]; /** How far ahead notifications are actually queued; undefined until the first sync. */ scheduleCoverage?: ScheduleCoverage; }