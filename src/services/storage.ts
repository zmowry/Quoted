import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_QUOTES } from '@/src/types';
import type { AdditionalQuotesSettings, Collection, DailyAssignments, DeliveryScope, NotificationTime, QueueState, Quote, QuoteOrder } from '@/src/types';

/**
 * Narrows an unknown value to a `DeliveryScope`, or null if it is not one.
 *
 * Every scope on disk was written by some build of this app, but not necessarily
 * this one: a variant added later, or a value corrupted in place, must land on
 * the default rather than reach `deliveryPool` as a scope it cannot resolve and
 * silently deliver nothing.
 */
const scopeOrNull = (value: unknown): DeliveryScope | null => {
  if (!value || typeof value !== 'object') return null;
  const { kind, id } = value as { kind?: unknown; id?: unknown };
  if (kind === 'all') return ALL_QUOTES;
  if ((kind === 'collection' || kind === 'theme') && typeof id === 'string' && id) {
    return { kind, id } as DeliveryScope;
  }
  return null;
};

export const DEFAULT_NOTIFICATION_TIME: NotificationTime = { hour: 9, minute: 0 };
export const DEFAULT_QUOTE_ORDER: QuoteOrder = 'shuffle';
export const DEFAULT_SOUND_ENABLED = true;
/** How many extra notifications a day the settings screen offers. */
export const MAX_EXTRA_QUOTES = 5;
export const DEFAULT_EXTRA_QUOTES: AdditionalQuotesSettings = {
  enabled: false,
  count: 2,
  times: [{ hour: 12, minute: 0 }, { hour: 20, minute: 0 }, { hour: 6, minute: 0 }, { hour: 15, minute: 0 }, { hour: 18, minute: 0 }],
  scopes: [null, null, null, null, null],
};
const DEFAULT_EXTRA = DEFAULT_EXTRA_QUOTES;

/**
 * Every key this app owns. `clearAll` wipes exactly this set, so anything
 * persisted anywhere in the app must be registered here or it will survive a
 * "clear all data" and quietly outlive the data the user asked us to delete.
 */
export const STORAGE_KEYS = {
  quotes: '@quote-bank/quotes',
  queue: '@quote-bank/queue',
  time: '@quote-bank/time',
  extra: '@quote-bank/extra-quotes',
  collections: '@quote-bank/collections',
  theme: '@quote-bank/theme',
  textSize: '@quote-bank/text-size',
  order: '@quote-bank/quote-order',
  sound: '@quote-bank/sound',
  assignments: '@quote-bank/daily-assignments',
  /** Superseded by `deliveryScope`; still registered so `clearAll` removes it. */
  deliveryCollection: '@quote-bank/delivery-collection',
  deliveryScope: '@quote-bank/delivery-scope',
} as const;

const KEYS = STORAGE_KEYS;
/**
 * A value written by a future version of the app, or corrupted on disk, must
 * not take down every other key's load: each key falls back to its own default
 * independently rather than one bad value throwing out of the whole app-mount
 * effect and leaving the bank looking empty with no explanation.
 */
const read = async <T,>(key: string, fallback: T): Promise<T> => {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

export const quoteStorage = {
  async getQuotes(): Promise<Quote[]> { return read(KEYS.quotes, []); },
  async saveQuote(quote: Quote): Promise<Quote[]> { const quotes = await this.getQuotes(); const next = quotes.some((item) => item.id === quote.id) ? quotes : [...quotes, quote]; await AsyncStorage.setItem(KEYS.quotes, JSON.stringify(next)); return next; },
  /**
   * Replaces a quote in place by id, leaving the array order untouched so an
   * edited quote does not jump position in the user's list. A no-op for an id
   * that is not present.
   *
   * Deliberately separate from `saveQuote`, which dedupes by id and *appends*:
   * routing an edit through that is a silent no-op, so a typo would be
   * uncorrectable except by deleting and rewriting — which changes the id and
   * loses the quote's collections and its delivery history.
   */
  async updateQuote(quote: Quote): Promise<Quote[]> { const next = (await this.getQuotes()).map((item) => item.id === quote.id ? quote : item); await AsyncStorage.setItem(KEYS.quotes, JSON.stringify(next)); return next; },
  async deleteQuote(id: string): Promise<Quote[]> { const next = (await this.getQuotes()).filter((quote) => quote.id !== id); await AsyncStorage.setItem(KEYS.quotes, JSON.stringify(next)); return next; },
  async getQueue(): Promise<QueueState> { return read(KEYS.queue, { shownIds: [] }); },
  async setQueue(queue: QueueState): Promise<void> { await AsyncStorage.setItem(KEYS.queue, JSON.stringify(queue)); },
  async getNotificationTime(): Promise<NotificationTime> { return read(KEYS.time, DEFAULT_NOTIFICATION_TIME); },
  async setNotificationTime(time: NotificationTime): Promise<void> { await AsyncStorage.setItem(KEYS.time, JSON.stringify(time)); },
  /**
   * Settings written by an older build have either no per-slot scopes at all or
   * a `collectionIds` array of bare ids, so the array is rebuilt to full length
   * on every read rather than migrated in place. That keeps `scopes[i]` safe to
   * index for any slot the UI can offer, whatever shape landed on disk.
   */
  async getAdditionalQuotes(): Promise<AdditionalQuotesSettings> {
    const stored = await read<AdditionalQuotesSettings & { collectionIds?: unknown }>(KEYS.extra, DEFAULT_EXTRA);
    const scopes = Array.isArray(stored.scopes) ? stored.scopes : [];
    // A build before themes stored `collectionIds: (string | null)[]`. Those ids
    // were always collections, so each one lifts straight into a scope.
    const legacy = Array.isArray(stored.collectionIds) ? stored.collectionIds : [];
    const { collectionIds: _dropped, ...rest } = stored;
    return {
      ...rest,
      scopes: Array.from({ length: MAX_EXTRA_QUOTES }, (_, i) => {
        const scope = scopeOrNull(scopes[i]);
        if (scope) return scope;
        const id = legacy[i];
        return typeof id === 'string' ? { kind: 'collection' as const, id } : null;
      }),
    };
  },
  async setAdditionalQuotes(settings: AdditionalQuotesSettings): Promise<void> { await AsyncStorage.setItem(KEYS.extra, JSON.stringify(settings)); },
  // Stored as a bare string rather than JSON; validated on read so an unexpected
  // value falls back to the default instead of reaching the picker logic.
  async getQuoteOrder(): Promise<QuoteOrder> { const raw = await AsyncStorage.getItem(KEYS.order); return raw === 'shuffle' || raw === 'sequential' ? raw : DEFAULT_QUOTE_ORDER; },
  async setQuoteOrder(order: QuoteOrder): Promise<void> { await AsyncStorage.setItem(KEYS.order, order); },
  async getSoundEnabled(): Promise<boolean> { return read(KEYS.sound, DEFAULT_SOUND_ENABLED); },
  async setSoundEnabled(enabled: boolean): Promise<void> { await AsyncStorage.setItem(KEYS.sound, JSON.stringify(enabled)); },
  async getDailyAssignments(): Promise<DailyAssignments> { return read(KEYS.assignments, {}); },
  async setDailyAssignments(assignments: DailyAssignments): Promise<void> { await AsyncStorage.setItem(KEYS.assignments, JSON.stringify(assignments)); },
  /**
   * What the daily rotation draws from.
   *
   * Falls back to the key this replaced, which held a bare collection id (or
   * nothing, meaning the whole bank). Reading rather than rewriting on upgrade
   * keeps the migration in one place and costs one extra `getItem` only until
   * the user next changes the setting — `setDeliveryScope` clears the old key.
   */
  async getDeliveryScope(): Promise<DeliveryScope> {
    const raw = await AsyncStorage.getItem(KEYS.deliveryScope);
    if (raw) {
      try {
        const scope = scopeOrNull(JSON.parse(raw));
        if (scope) return scope;
      } catch { /* fall through to the legacy key, then to the default */ }
    }
    const legacy = await AsyncStorage.getItem(KEYS.deliveryCollection);
    return legacy ? { kind: 'collection', id: legacy } : ALL_QUOTES;
  },
  async setDeliveryScope(scope: DeliveryScope): Promise<void> {
    await AsyncStorage.setItem(KEYS.deliveryScope, JSON.stringify(scope));
    // Removed rather than left behind: it is only ever consulted when the new key
    // is missing or unreadable, and a stale id there would resurrect a scope the
    // user has since changed.
    await AsyncStorage.removeItem(KEYS.deliveryCollection);
  },
  async getCollections(): Promise<Collection[]> { return read(KEYS.collections, []); },
  async setCollections(collections: Collection[]): Promise<void> { await AsyncStorage.setItem(KEYS.collections, JSON.stringify(collections)); },
  /**
   * Removes only this app's keys rather than calling AsyncStorage.clear(), which
   * would also destroy storage belonging to any other library sharing the store.
   */
  async clearAll(): Promise<void> { await AsyncStorage.multiRemove(Object.values(KEYS)); },
};
