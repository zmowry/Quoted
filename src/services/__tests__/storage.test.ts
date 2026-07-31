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

  // saveQuote appends and dedupes by id (pinned above), so an edit routed through
  // it is a silent no-op. updateQuote exists precisely because of that.
  it('updates a quote in place, holding its position in the list', async () => {
    const other: Quote = { id: 'q-2', text: 'Second', authorId: 'test', authorName: 'Tester' };
    await quoteStorage.saveQuote(quote);
    await quoteStorage.saveQuote(other);
    await quoteStorage.updateQuote({ ...quote, text: 'Rewritten' });
    // Position preserved, so an edited quote does not jump under the user.
    expect(await quoteStorage.getQuotes()).toEqual([{ ...quote, text: 'Rewritten' }, other]);
  });

  it('leaves the bank untouched when updating an id that is not there', async () => {
    await quoteStorage.saveQuote(quote);
    await quoteStorage.updateQuote({ id: 'nope', text: 'Ghost', authorId: 'x', authorName: 'X' });
    expect(await quoteStorage.getQuotes()).toEqual([quote]);
  });

  describe('additional quotes settings', () => {
    // Settings saved by a build without per-slot collections have no
    // `collectionIds` at all. Reading one back has to yield an entry for every
    // slot the UI can offer, since the pool builder indexes it by slot.
    it('fills in per-slot collections missing from older stored settings', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.extra, JSON.stringify({ enabled: true, count: 2, times: [{ hour: 12, minute: 0 }] }));
      const stored = await quoteStorage.getAdditionalQuotes();
      expect(stored.collectionIds).toEqual([null, null, null, null, null]);
      expect(stored).toMatchObject({ enabled: true, count: 2 });
    });

    it('pads a short list rather than leaving later slots undefined', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.extra, JSON.stringify({ enabled: true, count: 3, times: [], collectionIds: ['c1'] }));
      await expect(quoteStorage.getAdditionalQuotes()).resolves.toMatchObject({ collectionIds: ['c1', null, null, null, null] });
    });

    it('round-trips a saved per-slot collection', async () => {
      await quoteStorage.setAdditionalQuotes({ enabled: true, count: 1, times: [{ hour: 12, minute: 0 }], collectionIds: [null, 'c2', null, null, null] });
      await expect(quoteStorage.getAdditionalQuotes()).resolves.toMatchObject({ collectionIds: [null, 'c2', null, null, null] });
    });
  });

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
