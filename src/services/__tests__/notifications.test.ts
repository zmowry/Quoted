import * as Notifications from 'expo-notifications';
import { MAX_PENDING, scheduleAllNotifications } from '@/src/services/notifications';
import type { AdditionalQuotesSettings, PlannedDay, Quote } from '@/src/types';

const quote: Quote = { id: 'a', text: 'Keep moving', authorId: 'einstein', authorName: 'Albert Einstein' };
const second: Quote = { id: 'b', text: 'Stay curious', authorId: 'einstein', authorName: 'Albert Einstein' };
const third: Quote = { id: 'c', text: 'Ask again', authorId: 'twain', authorName: 'Mark Twain' };

// 29 July 2026, 08:00 local — before the 09:00 delivery time used below.
const NOW = new Date(2026, 6, 29, 8, 0);
const nine = { hour: 9, minute: 0 };

/** `days` consecutive days from NOW, cycling through the given quotes. */
const planFrom = (days: number, quotes: (Quote | undefined)[], extras: Quote[] = []): PlannedDay[] =>
  Array.from({ length: days }, (_, i) => {
    const day = new Date(NOW);
    day.setDate(NOW.getDate() + i);
    return { day, quote: quotes[i % quotes.length], extras };
  });

/**
 * Which collection each slot draws from is settled by the time a plan reaches
 * the scheduler — it only reads `enabled`, `count` and `times` — so these fixtures
 * leave the ids off rather than pretending to exercise them.
 */
const extrasSettings = (settings: Omit<AdditionalQuotesSettings, 'collectionIds'>): AdditionalQuotesSettings =>
  ({ ...settings, collectionIds: [] });

const requests = (): { content: { body: string; sound: boolean; data?: { quoteId?: string; authorId?: string } }; trigger: { type: string; date: Date } }[] =>
  (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map(([request]) => request);
const bodies = (): string[] => requests().map((request) => request.content.body);
const dates = (): Date[] => requests().map((request) => request.trigger.date);
const quoteIds = (): (string | undefined)[] => requests().map((request) => request.content.data?.quoteId);

describe('scheduleAllNotifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('writes out one dated notification per planned day, each with that day\'s quote', async () => {
    // A repeating trigger would replay a single fixed quote forever, so the
    // rotation only cycles while the app is closed if each day is written out.
    await scheduleAllNotifications(nine, planFrom(3, [quote, second, third]), undefined, { now: NOW });
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(bodies()).toEqual([
      '"Keep moving" -- Albert Einstein',
      '"Stay curious" -- Albert Einstein',
      '"Ask again" -- Mark Twain',
    ]);
    expect(dates().map((date) => [date.getDate(), date.getHours(), date.getMinutes()]))
      .toEqual([[29, 9, 0], [30, 9, 0], [31, 9, 0]]);
    expect(requests().every((request) => request.trigger.type === 'date')).toBe(true);
  });

  it('skips a delivery whose time has already passed today', async () => {
    // A date trigger in the past fires the instant it is scheduled, which would
    // push the quote already delivered this morning straight back to the screen.
    const afterDelivery = new Date(2026, 6, 29, 10, 0);
    await scheduleAllNotifications(nine, planFrom(2, [quote, second]), undefined, { now: afterDelivery });
    expect(bodies()).toEqual(['"Stay curious" -- Albert Einstein']);
    expect(dates()[0].getDate()).toBe(30);
  });

  it('uses No quotes saved when the bank has no quote', async () => {
    await scheduleAllNotifications(nine, planFrom(1, [undefined]), undefined, { now: NOW });
    expect(bodies()).toEqual(['No quotes saved!']);
  });

  it('degrades gracefully when notifications are unsupported or fail', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValueOnce(new Error('Unsupported on web'));
    await expect(scheduleAllNotifications(nine, planFrom(1, [quote]), undefined, { now: NOW })).resolves.toBeUndefined();
  });

  it('schedules nothing when permission is refused', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    await scheduleAllNotifications(nine, planFrom(1, [quote]), undefined, { now: NOW });
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('adds one extra notification per requested count on every planned day', async () => {
    const extra = extrasSettings({ enabled: true, count: 2, times: [{ hour: 12, minute: 0 }, { hour: 20, minute: 30 }] });
    // The extras come from the plan, which drew them from the same cycle as the
    // daily quote, rather than being picked off by array position here.
    await scheduleAllNotifications(nine, planFrom(2, [quote], [second, third]), extra, { now: NOW });
    // 2 days x (1 daily + 2 additional)
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(6);
    expect(bodies().slice(0, 3)).toEqual([
      '"Keep moving" -- Albert Einstein',
      '"Stay curious" -- Albert Einstein',
      '"Ask again" -- Mark Twain',
    ]);
    expect(dates().slice(0, 3).map((date) => [date.getDate(), date.getHours(), date.getMinutes()]))
      .toEqual([[29, 9, 0], [29, 12, 0], [29, 20, 30]]);
  });

  it('schedules only the daily quote when additional quotes are disabled', async () => {
    const extra = extrasSettings({ enabled: false, count: 3, times: [{ hour: 12, minute: 0 }] });
    await scheduleAllNotifications(nine, planFrom(1, [quote], [second]), extra, { now: NOW });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it('never schedules more extras than it has times for', async () => {
    const extra = extrasSettings({ enabled: true, count: 5, times: [{ hour: 12, minute: 0 }] });
    await scheduleAllNotifications(nine, planFrom(1, [quote], [second, third]), extra, { now: NOW });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  });

  it('tags every notification with the quote it carries', async () => {
    // Without the payload a tap cannot tell which quote was delivered, so the app
    // can only ever open on today's.
    await scheduleAllNotifications(nine, planFrom(3, [quote, second, third]), undefined, { now: NOW });
    expect(quoteIds()).toEqual(['a', 'b', 'c']);
    expect(requests()[2].content.data?.authorId).toBe('twain');
  });

  it('tags an extra with its own quote, not the day\'s daily one', async () => {
    const extra = extrasSettings({ enabled: true, count: 2, times: [{ hour: 12, minute: 0 }, { hour: 20, minute: 30 }] });
    await scheduleAllNotifications(nine, planFrom(1, [quote], [second, third]), extra, { now: NOW });
    expect(quoteIds()).toEqual(['a', 'b', 'c']);
  });

  it('leaves the empty-bank nudge with no quote id at all', async () => {
    // A guard rather than a fail-before test: with no payload at all this passes
    // too. It earns its place by failing the plausible wrong version — an
    // unconditional `data` object, which ships `quoteId: undefined` as a key the
    // tap handler would then have to tell apart from a real one.
    await scheduleAllNotifications(nine, planFrom(1, [undefined]), undefined, { now: NOW });
    expect(requests()[0].content.data).toBeUndefined();
  });

  it('stops at the pending-notification budget rather than overflowing the OS limit', async () => {
    // iOS keeps only the first 64 and silently drops the rest, so a long plan
    // has to be trimmed here rather than at the platform boundary.
    await scheduleAllNotifications(nine, planFrom(100, [quote]), undefined, { now: NOW });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(MAX_PENDING);
  });
});
