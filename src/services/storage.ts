import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AdditionalQuotesSettings, Collection, NotificationTime, QueueState, Quote } from '@/src/types';

export const DEFAULT_NOTIFICATION_TIME: NotificationTime = { hour: 9, minute: 0 };
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
} as const;

const KEYS = STORAGE_KEYS;
const read = async <T,>(key: string, fallback: T): Promise<T> => { const raw = await AsyncStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; };

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
  async getCollections(): Promise<Collection[]> { return read(KEYS.collections, []); },
  async setCollections(collections: Collection[]): Promise<void> { await AsyncStorage.setItem(KEYS.collections, JSON.stringify(collections)); },
  /**
   * Removes only this app's keys rather than calling AsyncStorage.clear(), which
   * would also destroy storage belonging to any other library sharing the store.
   */
  async clearAll(): Promise<void> { await AsyncStorage.multiRemove(Object.values(KEYS)); },
};
