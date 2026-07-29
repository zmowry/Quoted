jest.mock('@react-native-async-storage/async-storage', () => {
  const data = new Map<string, string>();
  return { getItem: jest.fn((key: string) => Promise.resolve(data.get(key) ?? null)), setItem: jest.fn((key: string, value: string) => { data.set(key, value); return Promise.resolve(); }), clear: jest.fn(() => { data.clear(); return Promise.resolve(); }) };
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_NOTIFICATION_TIME, quoteStorage, STORAGE_KEYS } from '@/src/services/storage';
import type { Quote } from '@/src/types';

const quote: Quote = { id: 'q-1', text: 'Test quote', authorId: 'test', authorName: 'Tester' };
beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

describe('quoteStorage', () => {
  it('creates, reads, and deletes a quote', async () => { await quoteStorage.saveQuote(quote); expect(await quoteStorage.getQuotes()).toEqual([quote]); await quoteStorage.deleteQuote(quote.id); expect(await quoteStorage.getQuotes()).toEqual([]); });
  it('deduplicates saved quotes by stable quote id', async () => { await quoteStorage.saveQuote(quote); await quoteStorage.saveQuote({ ...quote, text: 'Changed' }); expect(await quoteStorage.getQuotes()).toEqual([quote]); });
  it('persists notification delivery time', async () => { await quoteStorage.setNotificationTime({ hour: 14, minute: 30 }); expect(await quoteStorage.getNotificationTime()).toEqual({ hour: 14, minute: 30 }); });

  describe('corrupted storage', () => {
    it('falls back to the default instead of throwing when a value is not valid JSON', async () => {
      // A bare JSON.parse would throw here, and the mount effect that awaits
      // several of these in parallel has no catch — an unhandled rejection would
      // leave `loading` false and every other setting stuck at its initial
      // default, with the bank looking empty and no indication why.
      await AsyncStorage.setItem(STORAGE_KEYS.quotes, 'not json{');
      await expect(quoteStorage.getQuotes()).resolves.toEqual([]);
    });

    it('isolates the damage to the one corrupted key', async () => {
      // One bad value must not take down keys that parsed fine.
      await AsyncStorage.setItem(STORAGE_KEYS.quotes, '{not valid');
      await quoteStorage.setNotificationTime({ hour: 14, minute: 30 });
      await expect(quoteStorage.getNotificationTime()).resolves.toEqual({ hour: 14, minute: 30 });
    });

    it('falls back to defaults for every read-through-JSON key', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.time, 'garbage');
      await AsyncStorage.setItem(STORAGE_KEYS.collections, 'garbage');
      await AsyncStorage.setItem(STORAGE_KEYS.sound, 'garbage');
      await expect(quoteStorage.getNotificationTime()).resolves.toEqual(DEFAULT_NOTIFICATION_TIME);
      await expect(quoteStorage.getCollections()).resolves.toEqual([]);
      await expect(quoteStorage.getSoundEnabled()).resolves.toBe(true);
    });
  });
});
