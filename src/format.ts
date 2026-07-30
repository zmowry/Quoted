import type { Quote } from '@/src/types';

/**
 * The canonical plain-text rendering of a quote, used wherever it leaves the app
 * as text: the clipboard and notification bodies.
 *
 * Straight quotes rather than typographic ones, since this lands in whatever the
 * user pastes into and should survive plain-text destinations unchanged.
 */
export const quoteWithAttribution = (quote: Pick<Quote, 'text' | 'authorName'>): string =>
  `"${quote.text}" -- ${quote.authorName}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parsed field by field into a local date rather than handed to `new Date(key)`,
 * which reads the string as midnight UTC and so renders the day before for
 * anyone west of Greenwich — the same trap `dateKey` exists to avoid.
 */
const localDate = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * A delivery day rendered for a human: 'Today', 'Yesterday', or 'Jul 27'.
 *
 * Both arguments are local `YYYY-MM-DD` keys as produced by `dateKey`.
 */
export const dayLabel = (day: string, todayKey: string): string => {
  if (day === todayKey) return 'Today';
  const yesterday = localDate(todayKey);
  yesterday.setDate(yesterday.getDate() - 1);
  const asKey = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  if (day === asKey(yesterday)) return 'Yesterday';
  const parsed = localDate(day);
  return `${MONTHS[parsed.getMonth()]} ${parsed.getDate()}`;
};
