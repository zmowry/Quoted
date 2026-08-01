import type { AdditionalQuotesSettings, Collection, DailyAssignments, DeliveryScope, PlannedDay, Quote, QuoteOrder } from '@/src/types';
import { themesForQuote } from '@/src/data/authorsData';
import { quoteStorage } from './storage';

/**
 * The quotes a scope selects, or null when it selects nothing resolvable — an
 * `all` scope, or a collection that has since been deleted.
 *
 * Null and `[]` are deliberately different: an empty array means the scope
 * resolved and matched nothing, which the caller still treats as a fallback but
 * which `deliveryScopeActive` must be able to tell apart from "no scope set".
 */
const scopedQuotes = (quotes: Quote[], collections: Collection[], scope: DeliveryScope): Quote[] | null => {
  if (scope.kind === 'all') return null;
  if (scope.kind === 'theme') return quotes.filter((quote) => themesForQuote(quote).includes(scope.id));
  const collection = collections.find((item) => item.id === scope.id);
  return collection ? quotes.filter((quote) => collection.quoteIds.includes(quote.id)) : null;
};

/**
 * The quotes the rotation may draw from, given the user's delivery scope.
 *
 * Falls back to the whole bank in the cases that would otherwise be silent dead
 * ends: the chosen collection has been deleted, and the chosen collection or
 * theme matches none of the saved quotes. All of them would leave someone with a
 * full bank receiving "No quotes saved!" every morning because of a setting they
 * had forgotten about. Delivering something from the wider bank is the better
 * failure, and the settings screen says so rather than leaving it invisible.
 */
export function deliveryPool(quotes: Quote[], collections: Collection[], scope: DeliveryScope): Quote[] {
  const scoped = scopedQuotes(quotes, collections, scope);
  return scoped?.length ? scoped : quotes;
}

/** Whether `deliveryPool` is actually honouring the chosen scope. */
export const deliveryScopeActive = (quotes: Quote[], collections: Collection[], scope: DeliveryScope): boolean =>
  !!scopedQuotes(quotes, collections, scope)?.length;

/** How many extra notifications a day's settings actually resolve to. */
export const extraSlotCount = (extras: AdditionalQuotesSettings): number =>
  extras.enabled ? Math.max(0, Math.min(extras.count, extras.times.length)) : 0;

/**
 * Every pool one day's notifications can draw from: the daily quote's, one per
 * extra slot, and the union of them all.
 *
 * `all` is what the cycle bookkeeping needs — `reconcileQueue` and
 * `resetPlanFrom` both decide whether a shown id is still real, and judging that
 * against the daily pool alone would throw away an extra slot's progress every
 * time its collection sat outside the main scope.
 */
export interface RotationPools { main: Quote[]; extras: Quote[][]; all: Quote[] }

export function rotationPools(
  quotes: Quote[],
  collections: Collection[],
  scope: DeliveryScope,
  extras: AdditionalQuotesSettings,
): RotationPools {
  const main = deliveryPool(quotes, collections, scope);
  const extraPools = Array.from({ length: extraSlotCount(extras) }, (_, slot) => {
    // null means "follow the daily scope", so the slot tracks `main` rather than
    // widening to the whole bank behind the user's back.
    const slotScope = extras.scopes[slot] ?? null;
    return slotScope === null ? main : deliveryPool(quotes, collections, slotScope);
  });
  const seen = new Set<string>();
  const all: Quote[] = [];
  for (const quote of [main, ...extraPools].flat()) {
    if (seen.has(quote.id)) continue;
    seen.add(quote.id);
    all.push(quote);
  }
  return { main, extras: extraPools, all };
}

/** Days of assignment history kept; comfortably more than the planned horizon. */
const ASSIGNMENT_RETENTION = 21;

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * A quote belongs to the user's calendar day, so this is deliberately local time
 * rather than an ISO/UTC stamp: near midnight the two disagree about the date.
 */
export const dateKey = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * A day holds one slot per notification: the bare date key for the daily quote,
 * then a suffixed key per extra. Retention counts days, not slots, so turning
 * extra quotes on does not shorten the history.
 */
const slotKey = (key: string, index: number): string => `${key}#${index + 1}`;
const dayOf = (slot: string): string => slot.slice(0, 10);

// Day keys sort chronologically as plain strings, so the newest are simply the last.
const prune = (assignments: DailyAssignments): DailyAssignments => {
  const days = [...new Set(Object.keys(assignments).map(dayOf))].sort();
  const keep = new Set(days.slice(-ASSIGNMENT_RETENTION));
  return Object.fromEntries(Object.entries(assignments).filter(([slot]) => keep.has(dayOf(slot))));
};

async function assign(key: string, quote: Quote | undefined): Promise<void> {
  if (!quote) return;
  const assignments = await quoteStorage.getDailyAssignments();
  await quoteStorage.setDailyAssignments(prune({ ...assignments, [key]: quote.id }));
}

/**
 * The quote for a given calendar day, drawing a new one only when that day has
 * no quote yet. Assignments persist, so relaunching the app returns the same
 * quote instead of consuming another from the cycle.
 */
export async function quoteForDate(key: string, quotes: Quote[], order: QuoteOrder = 'sequential'): Promise<Quote | undefined> {
  if (!quotes.length) { await quoteStorage.setDailyAssignments({}); return nextQuoteInCycle(quotes, order); }
  const assignments = await quoteStorage.getDailyAssignments();
  // A deleted quote leaves its day dangling, so fall through and draw again.
  const assigned = quotes.find((quote) => quote.id === assignments[key]);
  if (assigned) return assigned;
  const next = await nextQuoteInCycle(quotes, order);
  await assign(key, next);
  return next;
}

/** Replaces a day's quote on explicit request, i.e. the banner's Refresh button. */
export async function reassignDate(key: string, quotes: Quote[], order: QuoteOrder = 'sequential'): Promise<Quote | undefined> {
  const current = (await quoteStorage.getDailyAssignments())[key];
  let next = await nextQuoteInCycle(quotes, order);
  // A cycle that has just exhausted itself resets and offers its first quote
  // again, which can be the one already on screen. Refresh has to visibly change
  // the quote whenever the bank holds an alternative; the draw above has since
  // marked the repeat as shown, so the second draw cannot return it.
  if (next && next.id === current && quotes.length > 1) next = await nextQuoteInCycle(quotes, order);
  await assign(key, next);
  return next;
}

/**
 * Assigns the next `days` calendar days, so the rotation can be written out to
 * the OS in advance and keep cycling while the app stays closed.
 *
 * Extra quotes draw from the same cycle as the daily one rather than being
 * picked off by array position, so the "every quote once before any repeats"
 * guarantee covers every notification the user actually receives.
 *
 * `extraPools` narrows an individual slot to its own collection. The cycle stays
 * shared across all of them, so a quote sent as an extra is still marked as seen
 * for the daily rotation; only the set it is drawn from differs. A slot with no
 * pool of its own falls back to `quotes`.
 */
export async function planRotation(
  quotes: Quote[],
  order: QuoteOrder = 'sequential',
  options: { days?: number; extras?: number; from?: Date; extraPools?: Quote[][] } = {},
): Promise<PlannedDay[]> {
  const { days = 1, extras = 0, from = new Date(), extraPools } = options;
  const plan: PlannedDay[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(from);
    day.setDate(from.getDate() + i);
    const key = dateKey(day);
    const quote = await quoteForDate(key, quotes, order);
    const extraQuotes: Quote[] = [];
    for (let slot = 0; slot < extras; slot++) {
      const pool = extraPools?.[slot] ?? quotes;
      const drawn = await quoteForDate(slotKey(key, slot), pool, order);
      if (drawn) extraQuotes.push(drawn);
    }
    plan.push({ day, quote, extras: extraQuotes });
  }
  return plan;
}

/**
 * Discards the planned future so an edited bank takes effect within a day rather
 * than waiting out a horizon already committed to storage.
 *
 * Today's quote survives — editing the bank is no reason to swap the quote out
 * from under the user mid-day — and the cycle restarts from it, which is why a
 * quote shown earlier in the cycle may come round again sooner than usual.
 */
export async function resetPlanFrom(key: string, quotes: Quote[]): Promise<void> {
  const assignments = await quoteStorage.getDailyAssignments();
  const kept = Object.fromEntries(Object.entries(assignments).filter(([slot]) => dayOf(slot) <= key));
  await quoteStorage.setDailyAssignments(kept);
  // Everything already promised to today keeps its place in the cycle, extras
  // included, so tomorrow cannot repeat a quote delivered this morning.
  const spent = Object.entries(kept)
    .filter(([slot]) => dayOf(slot) === key)
    .map(([, id]) => id)
    .filter((id) => quotes.some((quote) => quote.id === id));
  await quoteStorage.setQueue({ shownIds: [...new Set(spent)] });
}

/**
 * Chooses the next unseen quote; all saved quotes are shown once before reset.
 *
 * 'shuffle' randomises only *which* of the unseen quotes comes next, so the
 * no-repeat guarantee still holds — every quote is still shown once per cycle,
 * just in an unpredictable order rather than save order.
 *
 * The shown list is shared by every pool, but exhausting one pool only clears
 * that pool's ids from it. Wiping the list wholesale — which is all this needed
 * to do when there was a single pool — would let a three-quote collection on an
 * extra slot reset the whole bank's rotation every third day.
 */
export async function nextQuoteInCycle(quotes: Quote[], order: QuoteOrder = 'sequential'): Promise<Quote | undefined> {
  if (!quotes.length) { await quoteStorage.setQueue({ shownIds: [] }); return undefined; }
  const { shownIds } = await quoteStorage.getQueue();
  const available = quotes.filter((quote) => !shownIds.includes(quote.id));
  const cycle = available.length ? available : quotes;
  const quote = order === 'shuffle' ? cycle[Math.floor(Math.random() * cycle.length)] : cycle[0];
  // With one pool covering the whole bank this reduces to [quote.id], exactly as
  // before: every shown id is one of `quotes`, so the filter empties the list.
  const nextShown = available.length
    ? [...shownIds, quote.id]
    : [...shownIds.filter((id) => !quotes.some((item) => item.id === id)), quote.id];
  await quoteStorage.setQueue({ shownIds: nextShown });
  return quote;
}

/** One notification that has already gone out, resolved back to its quote. */
export interface DeliveredQuote {
  /** `YYYY-MM-DD` for the daily slot, `YYYY-MM-DD#n` for an extra. */
  slot: string;
  day: string;
  /** 0 for the daily notification, n for that day's nth extra. */
  extra: number;
  quote: Quote;
}

/** `missing` counts slots whose quote has since been deleted and cannot be resolved. */
export interface DeliveredHistory { entries: DeliveredQuote[]; missing: number }

/** A corrupted or unexpected suffix must not put NaN into the view. */
const slotIndex = (slot: string): number => {
  const hash = slot.indexOf('#');
  if (hash === -1) return 0;
  const parsed = Number(slot.slice(hash + 1));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
};

/**
 * The quotes already delivered, newest first.
 *
 * Assignments are written up to a fortnight AHEAD by `planRotation`, so the
 * `<= today` filter is the whole function: without it two thirds of the result
 * would be quotes the user has never received. Day keys sort chronologically as
 * plain strings, the same property `prune` relies on, so a string comparison is
 * enough.
 *
 * Today is included even before its delivery time has arrived: its quote is
 * already assigned and on the banner, and the caller labels days rather than
 * times, so nothing false is claimed. Gating on the configured time would
 * compare against *current* settings rather than the ones in force when the day
 * was planned; `now` is the seam if that ever needs to be stricter.
 *
 * Extras are ordered by slot, not by delivery time — the default extra times run
 * 12:00, 20:00, 06:00, ..., so slot #3 actually fires before the daily one. Rows
 * are labelled by slot and never claim a time.
 */
export async function deliveredHistory(
  quotes: Quote[],
  options: { now?: Date } = {},
): Promise<DeliveredHistory> {
  const today = dateKey(options.now ?? new Date());
  const assignments = await quoteStorage.getDailyAssignments();
  const entries: DeliveredQuote[] = [];
  let missing = 0;
  for (const [slot, id] of Object.entries(assignments)) {
    if (dayOf(slot) > today) continue;
    const quote = quotes.find((item) => item.id === id);
    // Deleting a quote leaves past assignments dangling by design — resetPlanFrom
    // only discards the future — so this is common rather than exotic.
    if (!quote) { missing++; continue; }
    entries.push({ slot, day: dayOf(slot), extra: slotIndex(slot), quote });
  }
  entries.sort((a, b) => a.day === b.day ? a.extra - b.extra : b.day.localeCompare(a.day));
  return { entries, missing };
}

/** The calendar day before `key`, as a `YYYY-MM-DD` local key. */
const previousDay = (key: string): string => {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return dateKey(date);
};

export interface DeliveryStats {
  /** Consecutive delivery days ending today, or yesterday if today has none yet. */
  currentStreak: number;
  /** Longest run of consecutive days, bounded by `ASSIGNMENT_RETENTION`. */
  bestStreak: number;
  /** Delivered slots up to and including today, extras included. */
  totalDelivered: number;
  /** Distinct days with at least one delivery. */
  daysDelivered: number;
  /** Most-delivered author whose quotes are still in the bank. */
  topAuthor?: { name: string; count: number };
  /** Progress through the current no-repeat cycle. */
  cycle: { shown: number; total: number };
}

/**
 * Delivery statistics, derived from the day assignments the scheduler keeps.
 *
 * Streaks are counted from the raw assignment *days* rather than from
 * `deliveredHistory`, which drops slots whose quote has since been deleted.
 * Routing streaks through that would let removing one quote retroactively punch
 * a hole in a run the user genuinely received — the day happened either way.
 *
 * `topAuthor` is the one figure that does need the quote resolved, so deleted
 * quotes are simply not attributed to anyone.
 *
 * Both streaks are capped by how much history is retained: `ASSIGNMENT_RETENTION`
 * is 21 days, so a longer run reads as 21 and the caller labels it as a window
 * rather than an all-time record.
 */
export async function deliveryStats(
  quotes: Quote[],
  pool: Quote[] = quotes,
  options: { now?: Date } = {},
): Promise<DeliveryStats> {
  const today = dateKey(options.now ?? new Date());
  const [assignments, queue] = await Promise.all([quoteStorage.getDailyAssignments(), quoteStorage.getQueue()]);

  const delivered = Object.entries(assignments).filter(([slot]) => dayOf(slot) <= today);
  const days = new Set(delivered.map(([slot]) => dayOf(slot)));

  // Today counting as a grace day: its quote is assigned when the day is planned,
  // but an empty bank plans nothing, and a streak should not read as broken at
  // 00:01 before that morning's delivery has had a chance to happen.
  let cursor = days.has(today) ? today : previousDay(today);
  let currentStreak = 0;
  while (days.has(cursor)) { currentStreak++; cursor = previousDay(cursor); }

  let bestStreak = 0;
  let run = 0;
  let previous: string | undefined;
  for (const day of [...days].sort()) {
    run = previous !== undefined && previousDay(day) === previous ? run + 1 : 1;
    if (run > bestStreak) bestStreak = run;
    previous = day;
  }

  const counts = new Map<string, number>();
  for (const [, id] of delivered) {
    const quote = quotes.find((item) => item.id === id);
    if (!quote) continue;
    counts.set(quote.authorName, (counts.get(quote.authorName) ?? 0) + 1);
  }
  // Ties break alphabetically so the figure does not flicker between equally
  // delivered authors as unrelated storage writes reorder the assignment map.
  const [topAuthor] = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    currentStreak,
    bestStreak,
    totalDelivered: delivered.length,
    daysDelivered: days.size,
    topAuthor,
    cycle: { shown: queue.shownIds.filter((id) => pool.some((quote) => quote.id === id)).length, total: pool.length },
  };
}

export async function reconcileQueue(quotes: Quote[]): Promise<void> {
  const queue = await quoteStorage.getQueue();
  await quoteStorage.setQueue({ shownIds: queue.shownIds.filter((id) => quotes.some((quote) => quote.id === id)) });
}
