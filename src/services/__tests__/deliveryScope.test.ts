jest.mock('@/src/services/storage', () => ({ quoteStorage: { getQueue: jest.fn(), setQueue: jest.fn(), getDailyAssignments: jest.fn(), setDailyAssignments: jest.fn() } }));
import { dateKey, deliveryPool, deliveryScopeActive, deliveryStats } from '@/src/services/queueManager';
import { quoteStorage } from '@/src/services/storage';
import type { Collection, Quote } from '@/src/types';

const quote = (id: string, authorName = 'X'): Quote => ({ id, text: id.toUpperCase(), authorId: authorName.toLowerCase(), authorName });
const quotes: Quote[] = [quote('a'), quote('b'), quote('c', 'Y')];
const collection = (id: string, quoteIds: string[]): Collection => ({ id, name: id, quoteIds });

/** `n` days before `from`, as the `YYYY-MM-DD` key the scheduler writes. */
const daysAgo = (n: number, from: Date): string => {
  const date = new Date(from);
  date.setDate(date.getDate() - n);
  return dateKey(date);
};

beforeEach(() => {
  jest.clearAllMocks();
  (quoteStorage.getQueue as jest.Mock).mockResolvedValue({ shownIds: [] });
  (quoteStorage.getDailyAssignments as jest.Mock).mockResolvedValue({});
});

describe('deliveryPool', () => {
  it('returns the whole bank when no collection is chosen', () => {
    expect(deliveryPool(quotes, [collection('c1', ['a'])], null)).toEqual(quotes);
  });

  it('narrows to the chosen collection', () => {
    expect(deliveryPool(quotes, [collection('c1', ['a', 'c'])], 'c1')).toEqual([quotes[0], quotes[2]]);
  });

  it('ignores ids the collection lists but the bank no longer holds', () => {
    expect(deliveryPool(quotes, [collection('c1', ['a', 'deleted'])], 'c1')).toEqual([quotes[0]]);
  });

  // Both fallbacks exist so a forgotten collection cannot silently stop delivery.
  it('falls back to the whole bank when the chosen collection is gone', () => {
    expect(deliveryPool(quotes, [], 'missing')).toEqual(quotes);
  });

  it('falls back to the whole bank when the chosen collection holds nothing saved', () => {
    expect(deliveryPool(quotes, [collection('c1', [])], 'c1')).toEqual(quotes);
    expect(deliveryPool(quotes, [collection('c1', ['deleted'])], 'c1')).toEqual(quotes);
  });
});

describe('deliveryScopeActive', () => {
  it('is false with no collection chosen, and true for one holding saved quotes', () => {
    expect(deliveryScopeActive(quotes, [collection('c1', ['a'])], null)).toBe(false);
    expect(deliveryScopeActive(quotes, [collection('c1', ['a'])], 'c1')).toBe(true);
  });

  it('is false exactly when the pool has fallen back', () => {
    expect(deliveryScopeActive(quotes, [collection('c1', [])], 'c1')).toBe(false);
    expect(deliveryScopeActive(quotes, [], 'missing')).toBe(false);
  });
});

describe('deliveryStats', () => {
  const now = new Date(2026, 6, 30);

  it('reports nothing for a bank that has never delivered', async () => {
    const stats = await deliveryStats(quotes, quotes, { now });
    expect(stats).toMatchObject({ currentStreak: 0, bestStreak: 0, totalDelivered: 0, daysDelivered: 0 });
    expect(stats.topAuthor).toBeUndefined();
  });

  it('counts consecutive days up to today as the current streak', async () => {
    (quoteStorage.getDailyAssignments as jest.Mock).mockResolvedValue({
      [daysAgo(0, now)]: 'a', [daysAgo(1, now)]: 'b', [daysAgo(2, now)]: 'c',
    });
    const stats = await deliveryStats(quotes, quotes, { now });
    expect(stats.currentStreak).toBe(3);
    expect(stats.daysDelivered).toBe(3);
  });

  it('breaks the streak on a missed day', async () => {
    (quoteStorage.getDailyAssignments as jest.Mock).mockResolvedValue({
      [daysAgo(0, now)]: 'a', [daysAgo(1, now)]: 'b', [daysAgo(3, now)]: 'c',
    });
    await expect(deliveryStats(quotes, quotes, { now })).resolves.toMatchObject({ currentStreak: 2, bestStreak: 2 });
  });

  // The day happened whether or not the quote survived, so deleting one must not
  // punch a retroactive hole in a run the user genuinely received.
  it('keeps a streak intact when a delivered quote has since been deleted', async () => {
    (quoteStorage.getDailyAssignments as jest.Mock).mockResolvedValue({
      [daysAgo(0, now)]: 'a', [daysAgo(1, now)]: 'since-deleted', [daysAgo(2, now)]: 'b',
    });
    await expect(deliveryStats(quotes, quotes, { now })).resolves.toMatchObject({ currentStreak: 3, totalDelivered: 3 });
  });

  it('treats yesterday as still alive when today has not been assigned', async () => {
    (quoteStorage.getDailyAssignments as jest.Mock).mockResolvedValue({
      [daysAgo(1, now)]: 'a', [daysAgo(2, now)]: 'b',
    });
    await expect(deliveryStats(quotes, quotes, { now })).resolves.toMatchObject({ currentStreak: 2 });
  });

  it('ignores days planned into the future', async () => {
    (quoteStorage.getDailyAssignments as jest.Mock).mockResolvedValue({
      [daysAgo(0, now)]: 'a', [daysAgo(-1, now)]: 'b', [daysAgo(-2, now)]: 'c',
    });
    await expect(deliveryStats(quotes, quotes, { now })).resolves.toMatchObject({ totalDelivered: 1, daysDelivered: 1 });
  });

  it('counts every slot in a day but the day only once', async () => {
    (quoteStorage.getDailyAssignments as jest.Mock).mockResolvedValue({
      [daysAgo(0, now)]: 'a', [`${daysAgo(0, now)}#1`]: 'b', [`${daysAgo(0, now)}#2`]: 'c',
    });
    await expect(deliveryStats(quotes, quotes, { now })).resolves.toMatchObject({ totalDelivered: 3, daysDelivered: 1, currentStreak: 1 });
  });

  it('reports the best run separately from the current one', async () => {
    (quoteStorage.getDailyAssignments as jest.Mock).mockResolvedValue({
      [daysAgo(0, now)]: 'a', [daysAgo(4, now)]: 'b', [daysAgo(5, now)]: 'c', [daysAgo(6, now)]: 'a',
    });
    await expect(deliveryStats(quotes, quotes, { now })).resolves.toMatchObject({ currentStreak: 1, bestStreak: 3 });
  });

  it('names the most delivered author, skipping quotes no longer in the bank', async () => {
    (quoteStorage.getDailyAssignments as jest.Mock).mockResolvedValue({
      [daysAgo(0, now)]: 'c', [daysAgo(1, now)]: 'c', [daysAgo(2, now)]: 'a', [daysAgo(3, now)]: 'gone',
    });
    await expect(deliveryStats(quotes, quotes, { now })).resolves.toMatchObject({ topAuthor: { name: 'Y', count: 2 } });
  });

  it('measures cycle progress against the delivery pool, not the whole bank', async () => {
    (quoteStorage.getQueue as jest.Mock).mockResolvedValue({ shownIds: ['a', 'c'] });
    const pool = deliveryPool(quotes, [collection('c1', ['a', 'b'])], 'c1');
    // 'c' is shown but outside the pool, so it counts toward neither figure.
    await expect(deliveryStats(quotes, pool, { now })).resolves.toMatchObject({ cycle: { shown: 1, total: 2 } });
  });
});
