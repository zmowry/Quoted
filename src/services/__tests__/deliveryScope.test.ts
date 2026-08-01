jest.mock('@/src/services/storage', () => ({ quoteStorage: { getQueue: jest.fn(), setQueue: jest.fn(), getDailyAssignments: jest.fn(), setDailyAssignments: jest.fn() } }));
import { dateKey, deliveryPool, deliveryScopeActive, deliveryStats } from '@/src/services/queueManager';
import { quoteStorage } from '@/src/services/storage';
import { ALL_QUOTES } from '@/src/types';
import type { Collection, DeliveryScope, Quote } from '@/src/types';
import type { ThemeId } from '@/src/data/themes';

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

const inCollection = (id: string): DeliveryScope => ({ kind: 'collection', id });
const withTheme = (id: ThemeId): DeliveryScope => ({ kind: 'theme', id });

describe('deliveryPool', () => {
  it('returns the whole bank when nothing is chosen', () => {
    expect(deliveryPool(quotes, [collection('c1', ['a'])], ALL_QUOTES)).toEqual(quotes);
  });

  it('narrows to the chosen collection', () => {
    expect(deliveryPool(quotes, [collection('c1', ['a', 'c'])], inCollection('c1'))).toEqual([quotes[0], quotes[2]]);
  });

  it('ignores ids the collection lists but the bank no longer holds', () => {
    expect(deliveryPool(quotes, [collection('c1', ['a', 'deleted'])], inCollection('c1'))).toEqual([quotes[0]]);
  });

  // Both fallbacks exist so a forgotten collection cannot silently stop delivery.
  it('falls back to the whole bank when the chosen collection is gone', () => {
    expect(deliveryPool(quotes, [], inCollection('missing'))).toEqual(quotes);
  });

  it('falls back to the whole bank when the chosen collection holds nothing saved', () => {
    expect(deliveryPool(quotes, [collection('c1', [])], inCollection('c1'))).toEqual(quotes);
    expect(deliveryPool(quotes, [collection('c1', ['deleted'])], inCollection('c1'))).toEqual(quotes);
  });
});

/**
 * Themed quotes need real author ids, since a built-in quote inherits its
 * author's tags. Seneca carries stoicism; Mark Twain carries humor and neither
 * carries the other's.
 */
describe('deliveryPool scoped to a theme', () => {
  const stoic: Quote = { id: 's', text: 'S', authorId: 'seneca', authorName: 'Seneca' };
  const funny: Quote = { id: 'f', text: 'F', authorId: 'twain', authorName: 'Mark Twain' };
  const mine: Quote = { id: 'm', text: 'M', authorId: 'custom:me', authorName: 'Me', themes: ['stoicism'] };
  const bank = [stoic, funny, mine];

  it('narrows to quotes carrying the theme', () => {
    expect(deliveryPool(bank, [], withTheme('stoicism'))).toEqual([stoic, mine]);
    expect(deliveryPool(bank, [], withTheme('humor'))).toEqual([funny]);
  });

  it('includes a quote the user tagged themselves', () => {
    // The case that does not work through the author table at all: `custom:me`
    // has no author record, so the quote's own themes are all it has.
    expect(deliveryPool([funny, mine], [], withTheme('stoicism'))).toEqual([mine]);
  });

  it('falls back to the whole bank when nothing carries the theme', () => {
    // Same reasoning as the collection fallback: delivering something from the
    // wider bank beats delivering nothing every morning.
    expect(deliveryPool(bank, [], withTheme('justice'))).toEqual(bank);
  });
});

describe('deliveryScopeActive', () => {
  it('is false with nothing chosen, and true for a collection holding saved quotes', () => {
    expect(deliveryScopeActive(quotes, [collection('c1', ['a'])], ALL_QUOTES)).toBe(false);
    expect(deliveryScopeActive(quotes, [collection('c1', ['a'])], inCollection('c1'))).toBe(true);
  });

  it('is false exactly when the pool has fallen back', () => {
    expect(deliveryScopeActive(quotes, [collection('c1', [])], inCollection('c1'))).toBe(false);
    expect(deliveryScopeActive(quotes, [], inCollection('missing'))).toBe(false);
  });

  it('tracks a theme scope the same way', () => {
    const stoic: Quote = { id: 's', text: 'S', authorId: 'seneca', authorName: 'Seneca' };
    expect(deliveryScopeActive([stoic], [], withTheme('stoicism'))).toBe(true);
    expect(deliveryScopeActive([stoic], [], withTheme('justice'))).toBe(false);
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
    const pool = deliveryPool(quotes, [collection('c1', ['a', 'b'])], inCollection('c1'));
    // 'c' is shown but outside the pool, so it counts toward neither figure.
    await expect(deliveryStats(quotes, pool, { now })).resolves.toMatchObject({ cycle: { shown: 1, total: 2 } });
  });
});
