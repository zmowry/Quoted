import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationTime, QueueState, Quote } from '@/src/types';

const KEYS = { quotes: '@quote-bank/quotes', queue: '@quote-bank/queue', time: '@quote-bank/time' } as const;
const read = async <T,>(key: string, fallback: T): Promise<T> => { const raw = await AsyncStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; };

export const quoteStorage = {
  async getQuotes(): Promise<Quote[]> { return read(KEYS.quotes, []); },
  async saveQuote(quote: Quote): Promise<Quote[]> { const quotes = await this.getQuotes(); const next = quotes.some((item) => item.id === quote.id) ? quotes : [...quotes, quote]; await AsyncStorage.setItem(KEYS.quotes, JSON.stringify(next)); return next; },
  async deleteQuote(id: string): Promise<Quote[]> { const next = (await this.getQuotes()).filter((quote) => quote.id !== id); await AsyncStorage.setItem(KEYS.quotes, JSON.stringify(next)); return next; },
  async getQueue(): Promise<QueueState> { return read(KEYS.queue, { shownIds: [] }); },
  async setQueue(queue: QueueState): Promise<void> { await AsyncStorage.setItem(KEYS.queue, JSON.stringify(queue)); },
  async getNotificationTime(): Promise<NotificationTime> { return read(KEYS.time, { hour: 9, minute: 0 }); },
  async setNotificationTime(time: NotificationTime): Promise<void> { await AsyncStorage.setItem(KEYS.time, JSON.stringify(time)); },
};
