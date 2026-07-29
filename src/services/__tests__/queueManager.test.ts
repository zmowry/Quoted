jest.mock('@/src/services/storage', () => ({ quoteStorage: { getQueue: jest.fn(), setQueue: jest.fn(), getDailyAssignments: jest.fn(), setDailyAssignments: jest.fn() } }));
import { dateKey, nextQuoteInCycle, planRotation, quoteForDate, reassignDate, resetPlanFrom } from '@/src/services/queueManager';
import { quoteStorage } from '@/src/services/storage';
import type { Quote } from '@/src/types';
const quotes: Quote[] = [{ id: 'a', text: 'A', authorId: 'x', authorName: 'X' }, { id: 'b', text: 'B', authorId: 'x', authorName: 'X' }];

describe('nextQuoteInCycle', () => {
  it('rotates without repeating and automatically resets after exhaustion', async () => {
    (quoteStorage.getQueue as jest.Mock).mockResolvedValueOnce({ shownIds: [] }).mockResolvedValueOnce({ shownIds: ['a'] }).mockResolvedValueOnce({ shownIds: ['a', 'b'] });
    await expect(nextQuoteInCycle(quotes)).resolves.toEqual(quotes[0]);
    await expect(nextQuoteInCycle(quotes)).resolves.toEqual(quotes[1]);
    await expect(nextQuoteInCycle(quotes)).resolves.toEqual(quotes[0]);
    expect(quoteStorage.setQueue).toHaveBeenNthCalledWith(1, { shownIds: ['a'] });
    expect(quoteStorage.setQueue).toHaveBeenNthCalledWith(2, { shownIds: ['a', 'b'] });
    expect(quoteStorage.setQueue).toHaveBeenNthCalledWith(3, { shownIds: ['a'] });
  });
  it('clears its queue and returns no quote for an empty bank', async () => { await expect(nextQuoteInCycle([])).resolves.toBeUndefined(); expect(quoteStorage.setQueue).toHaveBeenCalledWith({ shownIds: [] }); });

  describe('shuffle order', () => {
    const five: Quote[] = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, text: id.toUpperCase(), authorId: 'x', authorName: 'X' }));

    it('picks a different quote than sequential would, given the same queue', async () => {
      (quoteStorage.getQueue as jest.Mock).mockResolvedValue({ shownIds: [] });
      // Steer the RNG at the last entry; sequential would always yield the first.
      jest.spyOn(Math, 'random').mockReturnValue(0.99);
      await expect(nextQuoteInCycle(five, 'shuffle')).resolves.toEqual(five[4]);
      jest.spyOn(Math, 'random').mockRestore();
    });

    it('still shows every quote once before repeating', async () => {
      // The no-repeat guarantee is the whole point of the cycle, so randomising
      // the pick must not let a quote come up twice while others are unseen.
      let shownIds: string[] = [];
      (quoteStorage.getQueue as jest.Mock).mockImplementation(async () => ({ shownIds }));
      (quoteStorage.setQueue as jest.Mock).mockImplementation(async (q: { shownIds: string[] }) => { shownIds = q.shownIds; });

      const seen: string[] = [];
      for (let i = 0; i < five.length; i++) {
        const quote = await nextQuoteInCycle(five, 'shuffle');
        seen.push(quote!.id);
      }
      expect([...seen].sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
      expect(new Set(seen).size).toBe(five.length);
    });
  });
});

describe('dateKey', () => {
  it('keys by the local calendar day rather than UTC', () => {
    // Just after midnight local time the UTC date can still be the previous day,
    // which would hand the user a second quote for what they consider one day.
    expect(dateKey(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01');
  });
});

describe('quoteForDate', () => {
  let shownIds: string[];
  let assignments: Record<string, string>;

  beforeEach(() => {
    shownIds = []; assignments = {};
    (quoteStorage.getQueue as jest.Mock).mockImplementation(async () => ({ shownIds }));
    (quoteStorage.setQueue as jest.Mock).mockImplementation(async (q: { shownIds: string[] }) => { shownIds = q.shownIds; });
    (quoteStorage.getDailyAssignments as jest.Mock).mockImplementation(async () => assignments);
    (quoteStorage.setDailyAssignments as jest.Mock).mockImplementation(async (a: Record<string, string>) => { assignments = a; });
  });

  it('hands back the same quote all day instead of consuming one per call', async () => {
    // Each app launch used to advance the cycle, so re-opening the app burned
    // through the bank and left the banner disagreeing with the notification
    // already pending in the OS.
    const first = await quoteForDate('2026-07-29', quotes);
    const second = await quoteForDate('2026-07-29', quotes);
    expect(second).toEqual(first);
    expect(shownIds).toEqual([first!.id]);
  });

  it('draws the next quote once the day changes', async () => {
    const today = await quoteForDate('2026-07-29', quotes);
    const tomorrow = await quoteForDate('2026-07-30', quotes);
    expect(tomorrow).not.toEqual(today);
    expect(shownIds).toEqual(['a', 'b']);
  });

  it('re-draws a day whose assigned quote has since been deleted', async () => {
    await quoteForDate('2026-07-29', quotes);
    const remaining = quotes.filter((quote) => quote.id !== 'a');
    await expect(quoteForDate('2026-07-29', remaining)).resolves.toEqual(remaining[0]);
  });

  it('keeps assignment history bounded, retaining more than the planned horizon', async () => {
    for (let day = 1; day <= 25; day++) await quoteForDate(`2026-07-${String(day).padStart(2, '0')}`, quotes);
    expect(Object.keys(assignments)).toHaveLength(21);
    expect(Object.keys(assignments)).toContain('2026-07-25');
    expect(Object.keys(assignments)).not.toContain('2026-07-01');
  });

  it('clears assignments for an empty bank', async () => {
    await quoteForDate('2026-07-29', quotes);
    await expect(quoteForDate('2026-07-29', [])).resolves.toBeUndefined();
    expect(assignments).toEqual({});
  });

  it('replaces the day when reassigned, and keeps the replacement', async () => {
    const first = await quoteForDate('2026-07-29', quotes);
    const refreshed = await reassignDate('2026-07-29', quotes);
    expect(refreshed).not.toEqual(first);
    await expect(quoteForDate('2026-07-29', quotes)).resolves.toEqual(refreshed);
  });

  describe('planRotation', () => {
    const five: Quote[] = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, text: id.toUpperCase(), authorId: 'x', authorName: 'X' }));

    it('gives each upcoming day its own quote so the rotation runs unattended', async () => {
      const plan = await planRotation(five, 'sequential', { days: 5, from: new Date(2026, 6, 29) });
      expect(plan.map((day) => day.quote!.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
      expect(plan.map((day) => day.day.getDate())).toEqual([29, 30, 31, 1, 2]);
    });

    it('shows every quote once before repeating across the whole plan', async () => {
      const plan = await planRotation(five, 'sequential', { days: 10, from: new Date(2026, 6, 29) });
      expect(new Set(plan.slice(0, 5).map((day) => day.quote!.id)).size).toBe(5);
      expect(new Set(plan.slice(5).map((day) => day.quote!.id)).size).toBe(5);
    });

    it('re-planning the same days does not redraw them', async () => {
      const first = await planRotation(five, 'sequential', { days: 5, from: new Date(2026, 6, 29) });
      const again = await planRotation(five, 'sequential', { days: 5, from: new Date(2026, 6, 29) });
      expect(again.map((day) => day.quote!.id)).toEqual(first.map((day) => day.quote!.id));
    });

    it('extends an existing plan without disturbing the days already committed', async () => {
      // Days already written to the OS must keep their quote, or the notification
      // sitting in the queue stops matching what the app will show that morning.
      const first = await planRotation(five, 'sequential', { days: 3, from: new Date(2026, 6, 29) });
      const extended = await planRotation(five, 'sequential', { days: 5, from: new Date(2026, 6, 29) });
      expect(extended.slice(0, 3).map((day) => day.quote!.id)).toEqual(first.map((day) => day.quote!.id));
    });

    it('draws extra quotes from the same cycle as the daily one', async () => {
      // Extras used to be picked by array position, ignoring the queue entirely,
      // so they repeated quotes the cycle had already spent and never marked
      // themselves as shown.
      const plan = await planRotation(five, 'sequential', { days: 1, extras: 2, from: new Date(2026, 6, 29) });
      expect([plan[0].quote!.id, ...plan[0].extras.map((quote) => quote.id)]).toEqual(['a', 'b', 'c']);
      expect(shownIds).toEqual(['a', 'b', 'c']);
    });

    it('shows every quote once across daily and extra slots alike', async () => {
      const plan = await planRotation(five, 'sequential', { days: 5, extras: 2, from: new Date(2026, 6, 29) });
      const delivered = plan.flatMap((day) => [day.quote!.id, ...day.extras.map((quote) => quote.id)]);
      expect(delivered).toHaveLength(15);
      // 15 slots over a bank of 5 is exactly three clean passes, no quote twice
      // within any one of them.
      for (let pass = 0; pass < 3; pass++) {
        expect(new Set(delivered.slice(pass * 5, pass * 5 + 5)).size).toBe(5);
      }
    });

    it('keeps extra slots stable when the plan is rebuilt', async () => {
      const first = await planRotation(five, 'sequential', { days: 2, extras: 2, from: new Date(2026, 6, 29) });
      const again = await planRotation(five, 'sequential', { days: 2, extras: 2, from: new Date(2026, 6, 29) });
      expect(again.map((day) => day.extras.map((quote) => quote.id))).toEqual(first.map((day) => day.extras.map((quote) => quote.id)));
    });

    it('counts retention in days rather than slots, so extras do not shorten history', async () => {
      for (let day = 1; day <= 25; day++) {
        await planRotation(five, 'sequential', { days: 1, extras: 2, from: new Date(2026, 6, day) });
      }
      expect(new Set(Object.keys(assignments).map((slot) => slot.slice(0, 10))).size).toBe(21);
    });
  });

  describe('resetPlanFrom', () => {
    const five: Quote[] = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, text: id.toUpperCase(), authorId: 'x', authorName: 'X' }));

    it('drops the planned future so an edited bank takes effect the next day', async () => {
      await planRotation(five, 'sequential', { days: 5, from: new Date(2026, 6, 29) });
      await resetPlanFrom('2026-07-29', five);
      expect(Object.keys(assignments)).toEqual(['2026-07-29']);
    });

    it('keeps today so the quote does not change under the user mid-day', async () => {
      const plan = await planRotation(five, 'sequential', { days: 5, from: new Date(2026, 6, 29) });
      await resetPlanFrom('2026-07-29', five);
      await expect(quoteForDate('2026-07-29', five)).resolves.toEqual(plan[0].quote);
      expect(shownIds).toEqual([plan[0].quote!.id]);
    });

    it('re-draws today when its quote was the one deleted', async () => {
      await planRotation(five, 'sequential', { days: 5, from: new Date(2026, 6, 29) });
      const remaining = five.filter((quote) => quote.id !== 'a');
      await resetPlanFrom('2026-07-29', remaining);
      expect(shownIds).toEqual([]);
      await expect(quoteForDate('2026-07-29', remaining)).resolves.toEqual(remaining[0]);
    });

    it('keeps today\'s extra slots and counts them as spent', async () => {
      // Today's extras may already have been delivered, so tomorrow must not be
      // free to draw them again.
      await planRotation(five, 'sequential', { days: 3, extras: 2, from: new Date(2026, 6, 29) });
      await resetPlanFrom('2026-07-29', five);
      expect(Object.keys(assignments).sort()).toEqual(['2026-07-29', '2026-07-29#1', '2026-07-29#2']);
      expect(shownIds.sort()).toEqual(['a', 'b', 'c']);
    });
  });
});
