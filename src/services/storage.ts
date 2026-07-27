import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AdditionalQuotesSettings, Collection, NotificationTime, QueueState, Quote } from '@/src/types';

const DEFAULT_EXTRA: AdditionalQuotesSettings = { enabled: false, count: 2, times: [{ hour: 12, minute: 0 }, { hour: 20, minute: 0 }, { hour: 6, minute: 0 }, { hour: 15, minute: 0 }, { hour: 18, minute: 0 }] };

const KEYS = { quotes: '@quote-bank/quotes', queue: '@quote-bank/queue', time: '@quote-bank/time', extra: '@quote-bank/extra-quotes', collections: '@quote-bank/collections' } as const;
const read = async <T,>(key: string, fallback: T): Promise<T> => { const raw = await AsyncStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; };

export const quoteStorage = {
  async getQuotes(): Promise<Quote[]> { return read(KEYS.quotes, []); },
  async saveQuote(quote: Quote): Promise<Quote[]> { const quotes = await this.getQuotes(); const next = quotes.some((item) => item.id === quote.id) ? quotes : [...quotes, quote]; await AsyncStorage.setItem(KEYS.quotes, JSON.stringify(next)); return next; },
  async deleteQuote(id: string): Promise<Quote[]> { const next = (await this.getQuotes()).filter((quote) => quote.id !== id); await AsyncStorage.setItem(KEYS.quotes, JSON.stringify(next)); return next; },
  async getQueue(): Promise<QueueState> { return read(KEYS.queue, { shownIds: [] }); },
  async setQueue(queue: QueueState): Promise<void> { await AsyncStorage.setItem(KEYS.queue, JSON.stringify(queue)); },
  async getNotificationTime(): Promise<NotificationTime> { return read(KEYS.time, { hour: 9, minute: 0 }); },
  async setNotificationTime(time: NotificationTime): Promise<void> { await AsyncStorage.setItem(KEYS.time, JSON.stringify(time)); },
  async getAdditionalQuotes(): Promise<AdditionalQuotesSettings> { return read(KEYS.extra, DEFAULT_EXTRA); },
  async setAdditionalQuotes(settings: AdditionalQuotesSettings): Promise<void> { await AsyncStorage.setItem(KEYS.extra, JSON.stringify(settings)); },
  async getCollections(): Promise<Collection[]> { return read(KEYS.collections, []); },
  async setCollections(collections: Collection[]): Promise<void> { await AsyncStorage.setItem(KEYS.collections, JSON.stringify(collections)); },
};
