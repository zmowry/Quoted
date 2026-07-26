import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { NotificationTime, Quote } from '@/src/types';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }) });

export async function scheduleDailyNotification(time: NotificationTime, quote?: Quote): Promise<string | undefined> {
  // expo-notifications has limited web support. A scheduling failure must never
  // block quote storage or rendering in the web demo.
  try {
    if (Platform.OS === 'web' && (typeof Notification === 'undefined' || Notification.permission === 'denied')) return undefined;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('daily-quotes', { name: 'Daily quotes', importance: Notifications.AndroidImportance.HIGH });
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted' && (await Notifications.requestPermissionsAsync()).status !== 'granted') return undefined;
    await Notifications.cancelAllScheduledNotificationsAsync();
    return Notifications.scheduleNotificationAsync({
      content: { title: 'Daily Quote Bank', body: quote ? `“${quote.text}” — ${quote.authorName}` : 'No quotes saved!', sound: true },
      trigger: { hour: time.hour, minute: time.minute, repeats: true, channelId: 'daily-quotes' } as Notifications.NotificationTriggerInput,
    });
  } catch {
    return undefined;
  }
}
