/**
 * Stateful rather than a bare stub: the point of these tests is what the shown
 * list looks like *after* a draw, so the queue has to survive between calls.
 */
jest.mock('@/src/services/storage', () => {
  let queue: { shownIds: string[] } = { shownIds: [] };
  let assignments: Record<string, string> = {};
  return {
    quoteStorage: {
      getQueue: jest.fn(async () => ({ shownIds: [...queue.shownIds] })),
      setQueue: jest.fn(async (next: { shownIds: string[] }) => { queue = next; }),
      getDailyAssignments: jest.fn(async () => ({ ...assignments })),
      setDailyAssignments: jest.fn(async (next: Record<string, string>) => { assignments = next; }),
      __shown: () => queue.shownIds,
      __reset: () => { queue = { shownIds: [] }; assignments = {}; },
    },
  };
});

import { extraSlotCount, nextQuoteInCycle, planRotation, rotationPools } from '@/src/services/queueManager';
import { quoteStorage } from '@/src/services/storage';
import type { AdditionalQuotesSettings, Collection, Quote } from '@/src/types';

const store = quoteStorage as unknown as { __shown: () => string[]; __reset: () => void };

const quote = (id: string): Quote => ({ id, text: id.toUpperCase(), authorId: 'x', authorName: 'X' });
const bank: Quote[] = [quote('a'), quote('b'), quote('c'), quote('d')];
const collection = (id: string, quoteIds: string[]): Collection => ({ id, name: id, quoteIds });
const ids = (quotes: Quote[]): string[] => quotes.map((item) => item.id);

const extras = (partial: Partial<AdditionalQuotesSettings> = {}): AdditionalQuotesSettings => ({
  enabled: true,
  count: 1,
  times: [{ hour: 12, minute: 0 }, { hour: 20, minute: 0 }],
  collectionIds: [null, null, null, null, null],
  ...partial,
});

beforeEach(() => { jest.clearAllMocks(); store.__reset(); });

describe('extraSlotCount', () => {
  it('is zero while additional quotes are switched off', () => {
    expect(extraSlotCount(extras({ enabled: false, count: 3 }))).toBe(0);
  });

  it('never exceeds the times it has to fire at', () => {
    expect(extraSlotCount(extras({ count: 5 }))).toBe(2);
  });
});

describe('rotationPools', () => {
  const collections = [collection('c1', ['a', 'b']), collection('c2', ['d'])];

  it('gives a slot with no collection of its own the daily pool', () => {
    // Not the whole bank: a slot left alone tracks the daily scope, so narrowing
    // that narrows the extras with it rather than leaving them disagreeing.
    const pools = rotationPools(bank, collections, 'c1', extras());
    expect(ids(pools.main)).toEqual(['a', 'b']);
    expect(ids(pools.extras[0])).toEqual(['a', 'b']);
  });

  it('narrows a slot to its own collection, independently of the daily scope', () => {
    const pools = rotationPools(bank, collections, 'c1', extras({ collectionIds: ['c2', null, null, null, null] }));
    expect(ids(pools.main)).toEqual(['a', 'b']);
    expect(ids(pools.extras[0])).toEqual(['d']);
  });

  it('builds one pool per active slot and none while switched off', () => {
    expect(rotationPools(bank, collections, null, extras({ count: 2 })).extras).toHaveLength(2);
    expect(rotationPools(bank, collections, null, extras({ enabled: false })).extras).toEqual([]);
  });

  // `all` is what reconcileQueue and resetPlanFrom judge a shown id against, so
  // a quote reachable only through an extra slot has to be in it.
  it('unions every pool without repeating a quote in two of them', () => {
    const pools = rotationPools(bank, collections, 'c1', extras({ count: 2, collectionIds: ['c2', 'c1', null, null, null] }));
    expect(ids(pools.all).sort()).toEqual(['a', 'b', 'd']);
  });

  it('widens a slot back to the bank when its collection is empty or gone', () => {
    const pools = rotationPools(bank, [collection('c3', [])], null, extras({ count: 2, collectionIds: ['c3', 'missing', null, null, null] }));
    expect(ids(pools.extras[0])).toEqual(ids(bank));
    expect(ids(pools.extras[1])).toEqual(ids(bank));
  });

  it('treats a slot beyond the stored ids as following the daily scope', () => {
    // Settings written before per-slot collections existed normalise to a padded
    // array on read, but nothing may fall over if a short one reaches here.
    const pools = rotationPools(bank, [collection('c1', ['a'])], 'c1', extras({ collectionIds: [] }));
    expect(ids(pools.extras[0])).toEqual(['a']);
  });
});

describe('the shared no-repeat cycle across pools', () => {
  it('clears only the exhausted pool when a small collection wraps', async () => {
    // Three days of the daily rotation, then an extra slot scoped to a two-quote
    // collection runs out. Resetting the whole shown list — which is all a single
    // pool ever needed — would throw away the bank's place in its own cycle.
    const pool = [bank[0], bank[1]];
    await nextQuoteInCycle(bank, 'sequential');
    await nextQuoteInCycle(bank, 'sequential');
    await nextQuoteInCycle(bank, 'sequential');
    expect(store.__shown()).toEqual(['a', 'b', 'c']);

    const drawn = await nextQuoteInCycle(pool, 'sequential');
    expect(drawn?.id).toBe('a');
    expect(store.__shown()).toContain('c');
    expect(store.__shown()).not.toContain('b');
  });

  it('still resets to the single drawn quote when the pool is the whole bank', async () => {
    for (const _ of bank) await nextQuoteInCycle(bank, 'sequential');
    expect(store.__shown()).toEqual(['a', 'b', 'c', 'd']);

    await nextQuoteInCycle(bank, 'sequential');
    expect(store.__shown()).toEqual(['a']);
  });
});

describe('planRotation with per-slot pools', () => {
  it('draws each extra from its own pool and the daily quote from the main one', async () => {
    const [day] = await planRotation(bank, 'sequential', { days: 1, extras: 1, extraPools: [[bank[3]]] });
    expect(day.quote?.id).toBe('a');
    expect(day.extras.map((item) => item.id)).toEqual(['d']);
  });

  it('falls back to the main pool for a slot with none of its own', async () => {
    const [day] = await planRotation(bank, 'sequential', { days: 1, extras: 1 });
    expect(day.quote?.id).toBe('a');
    // Same cycle, so the extra takes the next unseen quote rather than repeating.
    expect(day.extras.map((item) => item.id)).toEqual(['b']);
  });
});
