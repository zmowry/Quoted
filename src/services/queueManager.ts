import type { Quote } from '@/src/types';
import { quoteStorage } from './storage';

/** Chooses the next unseen quote; all saved quotes are shown once before reset. */
export async function nextQuoteInCycle(quotes: Quote[]): Promise<Quote | undefined> {
  if (!quotes.length) { await quoteStorage.setQueue({ shownIds: [] }); return undefined; }
  const { shownIds } = await quoteStorage.getQueue();
  const available = quotes.filter((quote) => !shownIds.includes(quote.id));
  const cycle = available.length ? available : quotes;
  const quote = cycle[0];
  const nextShown = available.length ? [...shownIds, quote.id] : [quote.id];
  await quoteStorage.setQueue({ shownIds: nextShown });
  return quote;
}

export async function reconcileQueue(quotes: Quote[]): Promise<void> {
  const queue = await quoteStorage.getQueue();
  await quoteStorage.setQueue({ shownIds: queue.shownIds.filter((id) => quotes.some((quote) => quote.id === id)) });
}
