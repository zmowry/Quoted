import * as Notifications from 'expo-notifications';
import { scheduleDailyNotification } from '@/src/services/notifications';
import type { Quote } from '@/src/types';
const quote: Quote = { id: 'a', text: 'Keep moving', authorId: 'einstein', authorName: 'Albert Einstein' };

describe('scheduleDailyNotification', () => {
  beforeEach(() => jest.clearAllMocks());
  it('replaces the current schedule with a daily trigger at the requested time', async () => { await scheduleDailyNotification({ hour: 7, minute: 15 }, quote); expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled(); expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({ content: expect.objectContaining({ body: '“Keep moving” — Albert Einstein' }), trigger: expect.objectContaining({ hour: 7, minute: 15, repeats: true }) })); });
  it('uses No quotes saved when the bank has no quote', async () => { await scheduleDailyNotification({ hour: 9, minute: 0 }); expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({ content: expect.objectContaining({ body: 'No quotes saved!' }) })); });
  it('degrades gracefully when notifications are unsupported or fail', async () => { (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValueOnce(new Error('Unsupported on web')); await expect(scheduleDailyNotification({ hour: 9, minute: 0 }, quote)).resolves.toBeUndefined(); });
});
