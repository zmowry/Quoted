jest.mock('@/src/services/storage', () => ({ quoteStorage: { getQueue: jest.fn(), setQueue: jest.fn() } }));
import { nextQuoteInCycle } from '@/src/services/queueManager';
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
});
