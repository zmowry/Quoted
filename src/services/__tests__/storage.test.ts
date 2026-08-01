// A local mock rather than the one in jest.setup, so the corrupted-storage tests
// below can reach in and make `getItem` misbehave without affecting other suites.
// It has to cover every method `quoteStorage` calls: `removeItem` clears the
// superseded delivery key and `multiRemove` is how `clearAll` works, and a mock
// missing either fails as "not a function" rather than as a wrong result.
jest.mock('@react-native-async-storage/async-storage', () => {
  const data = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => Promise.resolve(data.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => { data.set(key, value); return Promise.resolve(); }),
    removeItem: jest.fn((key: string) => { data.delete(key); return Promise.resolve(); }),
    multiRemove: jest.fn((keys: string[]) => { keys.forEach((key) => data.delete(key)); return Promise.resolve(); }),
    clear: jest.fn(() => { data.clear(); return Promise.resolve(); }),
  };
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
    // Settings saved by a build without per-slot scopes have none at all.
    // Reading one back has to yield an entry for every slot the UI can offer,
    // since the pool builder indexes it by slot.
    it('fills in per-slot scopes missing from older stored settings', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.extra, JSON.stringify({ enabled: true, count: 2, times: [{ hour: 12, minute: 0 }] }));
      const stored = await quoteStorage.getAdditionalQuotes();
      expect(stored.scopes).toEqual([null, null, null, null, null]);
      expect(stored).toMatchObject({ enabled: true, count: 2 });
    });

    it('pads a short list rather than leaving later slots undefined', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.extra, JSON.stringify({ enabled: true, count: 3, times: [], scopes: [{ kind: 'collection', id: 'c1' }] }));
      await expect(quoteStorage.getAdditionalQuotes()).resolves.toMatchObject({
        scopes: [{ kind: 'collection', id: 'c1' }, null, null, null, null],
      });
    });

    it('round-trips a saved per-slot scope', async () => {
      await quoteStorage.setAdditionalQuotes({ enabled: true, count: 1, times: [{ hour: 12, minute: 0 }], scopes: [null, { kind: 'theme', id: 'stoicism' }, null, null, null] });
      await expect(quoteStorage.getAdditionalQuotes()).resolves.toMatchObject({
        scopes: [null, { kind: 'theme', id: 'stoicism' }, null, null, null],
      });
    });

    // The shape written by every build before themes existed: bare ids, which
    // were always collections.
    it('lifts legacy per-slot collection ids into collection scopes', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.extra, JSON.stringify({ enabled: true, count: 2, times: [], collectionIds: ['c1', null, 'c2'] }));
      await expect(quoteStorage.getAdditionalQuotes()).resolves.toMatchObject({
        scopes: [{ kind: 'collection', id: 'c1' }, null, { kind: 'collection', id: 'c2' }, null, null],
      });
    });

    it('does not carry the legacy key forward once migrated', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.extra, JSON.stringify({ enabled: true, count: 1, times: [], collectionIds: ['c1'] }));
      const stored = await quoteStorage.getAdditionalQuotes();
      expect('collectionIds' in stored).toBe(false);
    });
  });

  describe('delivery scope', () => {
    it('defaults to the whole bank', async () => {
      await expect(quoteStorage.getDeliveryScope()).resolves.toEqual({ kind: 'all' });
    });

    it('round-trips a collection and a theme scope', async () => {
      await quoteStorage.setDeliveryScope({ kind: 'collection', id: 'c1' });
      await expect(quoteStorage.getDeliveryScope()).resolves.toEqual({ kind: 'collection', id: 'c1' });
      await quoteStorage.setDeliveryScope({ kind: 'theme', id: 'stoicism' });
      await expect(quoteStorage.getDeliveryScope()).resolves.toEqual({ kind: 'theme', id: 'stoicism' });
    });

    // The key this replaced held a bare collection id, or nothing at all.
    it('migrates a stored bare collection id', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.deliveryCollection, 'c9');
      await expect(quoteStorage.getDeliveryScope()).resolves.toEqual({ kind: 'collection', id: 'c9' });
    });

    it('clears the legacy key once a scope is set, so it cannot resurrect', async () => {
      await AsyncStorage.setItem(STORAGE_KEYS.deliveryCollection, 'c9');
      await quoteStorage.setDeliveryScope({ kind: 'theme', id: 'humor' });
      expect(await AsyncStorage.getItem(STORAGE_KEYS.deliveryCollection)).toBeNull();
      await expect(quoteStorage.getDeliveryScope()).resolves.toEqual({ kind: 'theme', id: 'humor' });
    });

    it('falls back to the whole bank rather than passing on an unusable scope', async () => {
      // A variant from a future build, or a value corrupted in place, must not
      // reach deliveryPool as something it cannot resolve.
      await AsyncStorage.setItem(STORAGE_KEYS.deliveryScope, JSON.stringify({ kind: 'mood', id: 'wistful' }));
      await expect(quoteStorage.getDeliveryScope()).resolves.toEqual({ kind: 'all' });

      await AsyncStorage.setItem(STORAGE_KEYS.deliveryScope, 'not json');
      await expect(quoteStorage.getDeliveryScope()).resolves.toEqual({ kind: 'all' });
    });

    it('is removed by clearing all data', async () => {
      await quoteStorage.setDeliveryScope({ kind: 'theme', id: 'humor' });
      await quoteStorage.clearAll();
      await expect(quoteStorage.getDeliveryScope()).resolves.toEqual({ kind: 'all' });
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
