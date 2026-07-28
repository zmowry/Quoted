import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { AdditionalQuotesSettings, NotificationTime, Quote } from '@/src/types';

// SDK 53+ replaced the single `shouldShowAlert` flag with separate banner/list controls.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

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

/**
 * Drops every pending notification.
 *
 * Scheduled notifications hold a copy of the quote text in the OS, outside our
 * storage. Wiping AsyncStorage alone would leave those queued, so the user's
 * quotes would keep appearing on the lock screen after they erased them.
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing actionable for the user; the data wipe itself still proceeds.
  }
}

export async function scheduleAllNotifications(
  mainTime: NotificationTime,
  mainQuote: Quote | undefined,
  additionalSettings?: AdditionalQuotesSettings,
  allQuotes?: Quote[],
  options?: { skipIfAlreadyScheduled?: boolean }
): Promise<void> {
  try {
    if (!(await ensurePermission())) return;
    if (options?.skipIfAlreadyScheduled) {
      const existing = await Notifications.getAllScheduledNotificationsAsync();
      if (existing.length > 0) return;
    }
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
