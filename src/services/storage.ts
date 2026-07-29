import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AdditionalQuotesSettings, Collection, DailyAssignments, NotificationTime, QueueState, Quote, QuoteOrder } from '@/src/types';

export const DEFAULT_NOTIFICATION_TIME: NotificationTime = { hour: 9, minute: 0 };
export const DEFAULT_QUOTE_ORDER: QuoteOrder = 'shuffle';
export const DEFAULT_SOUND_ENABLED = true;
export const DEFAULT_EXTRA_QUOTES: AdditionalQuotesSettings = { enabled: false, count: 2, times: [{ hour: 12, minute: 0 }, { hour: 20, minute: 0 }, { hour: 6, minute: 0 }, { hour: 15, minute: 0 }, { hour: 18, minute: 0 }] };
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
  async deleteQuote(id: string): Promise<Quote[]> { const next = (await this.getQuotes()).filter((quote) => quote.id !== id); await AsyncStorage.setItem(KEYS.quotes, JSON.stringify(next)); return next; },
  async getQueue(): Promise<QueueState> { return read(KEYS.queue, { shownIds: [] }); },
  async setQueue(queue: QueueState): Promise<void> { await AsyncStorage.setItem(KEYS.queue, JSON.stringify(queue)); },
  async getNotificationTime(): Promise<NotificationTime> { return read(KEYS.time, DEFAULT_NOTIFICATION_TIME); },
  async setNotificationTime(time: NotificationTime): Promise<void> { await AsyncStorage.setItem(KEYS.time, JSON.stringify(time)); },
  async getAdditionalQuotes(): Promise<AdditionalQuotesSettings> { return read(KEYS.extra, DEFAULT_EXTRA); },
  async setAdditionalQuotes(settings: AdditionalQuotesSettings): Promise<void> { await AsyncStorage.setItem(KEYS.extra, JSON.stringify(settings)); },
  // Stored as a bare string rather than JSON; validated on read so an unexpected
  // value falls back to the default instead of reaching the picker logic.
  async getQuoteOrder(): Promise<QuoteOrder> { const raw = await AsyncStorage.getItem(KEYS.order); return raw === 'shuffle' || raw === 'sequential' ? raw : DEFAULT_QUOTE_ORDER; },
  async setQuoteOrder(order: QuoteOrder): Promise<void> { await AsyncStorage.setItem(KEYS.order, order); },
  async getSoundEnabled(): Promise<boolean> { return read(KEYS.sound, DEFAULT_SOUND_ENABLED); },
  async setSoundEnabled(enabled: boolean): Promise<void> { await AsyncStorage.setItem(KEYS.sound, JSON.stringify(enabled)); },
  async getDailyAssignments(): Promise<DailyAssignments> { return read(KEYS.assignments, {}); },
  async setDailyAssignments(assignments: DailyAssignments): Promise<void> { await AsyncStorage.setItem(KEYS.assignments, JSON.stringify(assignments)); },
  async getCollections(): Promise<Collection[]> { return read(KEYS.collections, []); },
  async setCollections(collections: Collection[]): Promise<void> { await AsyncStorage.setItem(KEYS.collections, JSON.stringify(collections)); },
  /**
   * Removes only this app's keys rather than calling AsyncStorage.clear(), which
   * would also destroy storage belonging to any other library sharing the store.
   */
  async clearAll(): Promise<void> { await AsyncStorage.multiRemove(Object.values(KEYS)); },
};
