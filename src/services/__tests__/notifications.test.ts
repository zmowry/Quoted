import * as Notifications from 'expo-notifications';
import { scheduleAllNotifications } from '@/src/services/notifications';
import type { AdditionalQuotesSettings, Quote } from '@/src/types';

const quote: Quote = { id: 'a', text: 'Keep moving', authorId: 'einstein', authorName: 'Albert Einstein' };
const second: Quote = { id: 'b', text: 'Stay curious', authorId: 'einstein', authorName: 'Albert Einstein' };
const third: Quote = { id: 'c', text: 'Ask again', authorId: 'twain', authorName: 'Mark Twain' };

describe('scheduleAllNotifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('replaces the current schedule with a daily trigger at the requested time', async () => {
    await scheduleAllNotifications({ hour: 7, minute: 15 }, quote);
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.objectContaining({ body: '"Keep moving" -- Albert Einstein' }),
      trigger: expect.objectContaining({ hour: 7, minute: 15, repeats: true }),
    }));
  });

  it('uses No quotes saved when the bank has no quote', async () => {
    await scheduleAllNotifications({ hour: 9, minute: 0 }, undefined);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.objectContaining({ body: 'No quotes saved!' }),
    }));
  });

  it('degrades gracefully when notifications are unsupported or fail', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValueOnce(new Error('Unsupported on web'));
    await expect(scheduleAllNotifications({ hour: 9, minute: 0 }, quote)).resolves.toBeUndefined();
  });

  it('schedules nothing when permission is refused', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    await scheduleAllNotifications({ hour: 9, minute: 0 }, quote);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('adds one extra notification per requested count, continuing past the daily quote', async () => {
    const extra: AdditionalQuotesSettings = { enabled: true, count: 2, times: [{ hour: 12, minute: 0 }, { hour: 20, minute: 30 }] };
    await scheduleAllNotifications({ hour: 9, minute: 0 }, quote, extra, [quote, second, third]);
    // 1 daily + 2 additional
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(3);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenNthCalledWith(2, expect.objectContaining({
      content: expect.objectContaining({ body: '"Stay curious" -- Albert Einstein' }),
      trigger: expect.objectContaining({ hour: 12, minute: 0 }),
    }));
    expect(Notifications.scheduleNotificationAsync).toHaveBeenNthCalledWith(3, expect.objectContaining({
      content: expect.objectContaining({ body: '"Ask again" -- Mark Twain' }),
      trigger: expect.objectContaining({ hour: 20, minute: 30 }),
    }));
  });

  it('schedules only the daily quote when additional quotes are disabled', async () => {
    const extra: AdditionalQuotesSettings = { enabled: false, count: 3, times: [{ hour: 12, minute: 0 }] };
    await scheduleAllNotifications({ hour: 9, minute: 0 }, quote, extra, [quote, second]);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it('never schedules more extras than it has times for', async () => {
    const extra: AdditionalQuotesSettings = { enabled: true, count: 5, times: [{ hour: 12, minute: 0 }] };
    await scheduleAllNotifications({ hour: 9, minute: 0 }, quote, extra, [quote, second]);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  });
});
