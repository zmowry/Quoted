import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { quoteWithAttribution } from '@/src/format';
import type { AdditionalQuotesSettings, NotificationTime, PlannedDay } from '@/src/types';

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

/**
 * iOS keeps at most 64 pending local notifications and silently drops the rest,
 * so the plan is trimmed to leave headroom rather than risk losing its tail.
 */
export const MAX_PENDING = 60;

const at = (day: Date, time: NotificationTime): Date => {
  const when = new Date(day);
  when.setHours(time.hour, time.minute, 0, 0);
  return when;
};

/**
 * Lays out one dated notification per quote per day.
 *
 * A repeating trigger cannot do this: it is a single notification object whose
 * body is fixed when it is scheduled, so it replays the same quote forever. The
 * OS will not wake the app at delivery time to swap the text either, which is
 * why the rotation has to be written out in advance, one notification per day,
 * and topped back up to the full horizon every time the app is opened.
 */
export async function scheduleAllNotifications(
  mainTime: NotificationTime,
  plan: PlannedDay[],
  additionalSettings?: AdditionalQuotesSettings,
  options?: { sound?: boolean; now?: Date }
): Promise<void> {
  const sound = options?.sound ?? true;
  const now = options?.now ?? new Date();
  try {
    if (!(await ensurePermission())) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    // Which quote each extra carries is decided by the plan, which draws them
    // from the same cycle as the daily quote; only the times are settings.
    const extraTimes = additionalSettings?.enabled ? additionalSettings.times.slice(0, additionalSettings.count) : [];
    let scheduled = 0;
    for (const { day, quote, extras } of plan) {
      const occurrences = [{ when: at(day, mainTime), quote, title: 'Daily Quote Bank' }];
      extraTimes.forEach((time, i) => {
        if (extras[i]) occurrences.push({ when: at(day, time), quote: extras[i], title: 'Quote Bank' });
      });
      for (const occurrence of occurrences) {
        // A date trigger in the past fires the moment it is scheduled, which
        // would push today's already-delivered quote straight to the lock screen.
        if (occurrence.when <= now) continue;
        if (scheduled >= MAX_PENDING) return;
        await Notifications.scheduleNotificationAsync({
          content: { title: occurrence.title, body: occurrence.quote ? quoteWithAttribution(occurrence.quote) : 'No quotes saved!', sound },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: occurrence.when, channelId: 'daily-quotes' },
        });
        scheduled++;
      }
    }
  } catch {
    // scheduling failures must not block UI
  }
}
