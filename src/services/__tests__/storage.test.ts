jest.mock('@react-native-async-storage/async-storage', () => {
  const data = new Map<string, string>();
  return { getItem: jest.fn((key: string) => Promise.resolve(data.get(key) ?? null)), setItem: jest.fn((key: string, value: string) => { data.set(key, value); return Promise.resolve(); }), clear: jest.fn(() => { data.clear(); return Promise.resolve(); }) };
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quoteStorage } from '@/src/services/storage';
import type { Quote } from '@/src/types';

const quote: Quote = { id: 'q-1', text: 'Test quote', authorId: 'test', authorName: 'Tester' };
beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

describe('quoteStorage', () => {
  it('creates, reads, and deletes a quote', async () => { await quoteStorage.saveQuote(quote); expect(await quoteStorage.getQuotes()).toEqual([quote]); await quoteStorage.deleteQuote(quote.id); expect(await quoteStorage.getQuotes()).toEqual([]); });
  it('deduplicates saved quotes by stable quote id', async () => { await quoteStorage.saveQuote(quote); await quoteStorage.saveQuote({ ...quote, text: 'Changed' }); expect(await quoteStorage.getQuotes()).toEqual([quote]); });
  it('persists notification delivery time', async () => { await quoteStorage.setNotificationTime({ hour: 14, minute: 30 }); expect(await quoteStorage.getNotificationTime()).toEqual({ hour: 14, minute: 30 }); });
});
