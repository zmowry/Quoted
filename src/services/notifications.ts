import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { AdditionalQuotesSettings, NotificationTime, Quote } from '@/src/types';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }) });

async function ensurePermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web' && (typeof Notification === 'undefined' || Notification.permission === 'denied')) return false;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('daily-quotes', { name: 'Daily quotes', importance: Notifications.AndroidImportance.HIGH });
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted' && (await Notifications.requestPermissionsAsync()).status !== 'granted') return false;
    return true;
  } catch {
    return false;
  }
}

export async function scheduleAllNotifications(
  mainTime: NotificationTime,
  mainQuote: Quote | undefined,
  additionalSettings?: AdditionalQuotesSettings,
  allQuotes?: Quote[]
): Promise<void> {
  try {
    if (!(await ensurePermission())) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Daily Quote Bank', body: mainQuote ? `"${mainQuote.text}" -- ${mainQuote.authorName}` : 'No quotes saved!', sound: true },
      trigger: { hour: mainTime.hour, minute: mainTime.minute, repeats: true, channelId: 'daily-quotes' } as Notifications.NotificationTriggerInput,
    });
    if (additionalSettings?.enabled && allQuotes && allQuotes.length > 0) {
      const mainIdx = mainQuote ? allQuotes.findIndex((q) => q.id === mainQuote.id) : -1;
      for (let i = 0; i < additionalSettings.count && i < additionalSettings.times.length; i++) {
        const q = allQuotes[(mainIdx + 1 + i) % allQuotes.length];
        const t = additionalSettings.times[i];
        await Notifications.scheduleNotificationAsync({
          content: { title: 'Quote Bank', body: q ? `"${q.text}" -- ${q.authorName}` : 'No quotes saved!', sound: true },
          trigger: { hour: t.hour, minute: t.minute, repeats: true, channelId: 'daily-quotes' } as Notifications.NotificationTriggerInput,
        });
      }
    }
  } catch {
    // scheduling failures must not block UI
  }
}
