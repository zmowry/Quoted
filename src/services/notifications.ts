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

/**
 * One slot held back from the budget for the top-up reminder.
 *
 * Reserved rather than taken opportunistically: the reminder is the only thing
 * standing between a truncated plan and silent, permanent failure, so it cannot
 * be the notification that gets dropped for lack of room.
 */
const QUOTE_BUDGET = MAX_PENDING - 1;

/** What a scheduling pass actually committed to the OS. */
export interface ScheduleCoverage {
  /**
   * The last calendar day carrying a quote, or undefined when none were
   * scheduled — an empty bank, a denied permission, or a horizon already spent.
   */
  through?: Date;
  /** True when the notification budget cut the plan short of the full horizon. */
  truncated: boolean;
  /** Quote notifications written; excludes the top-up reminder. */
  scheduled: number;
}

const NO_COVERAGE: ScheduleCoverage = { truncated: false, scheduled: 0 };

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
): Promise<ScheduleCoverage> {
  const sound = options?.sound ?? true;
  const now = options?.now ?? new Date();
  let scheduled = 0;
  let truncated = false;
  let through: Date | undefined;
  try {
    if (!(await ensurePermission())) return NO_COVERAGE;
    await Notifications.cancelAllScheduledNotificationsAsync();
    // Which quote each extra carries is decided by the plan, which draws them
    // from the same cycle as the daily quote; only the times are settings.
    const extraTimes = additionalSettings?.enabled ? additionalSettings.times.slice(0, additionalSettings.count) : [];
    days: for (const { day, quote, extras } of plan) {
      const occurrences = [{ when: at(day, mainTime), quote, title: 'Daily Quote Bank' }];
      extraTimes.forEach((time, i) => {
        if (extras[i]) occurrences.push({ when: at(day, time), quote: extras[i], title: 'Quote Bank' });
      });
      for (const occurrence of occurrences) {
        // A date trigger in the past fires the moment it is scheduled, which
        // would push today's already-delivered quote straight to the lock screen.
        if (occurrence.when <= now) continue;
        // Breaks rather than returns, so the reminder below still gets written:
        // running out of budget is precisely the case it exists for.
        if (scheduled >= QUOTE_BUDGET) { truncated = true; break days; }
        await Notifications.scheduleNotificationAsync({
          content: {
            title: occurrence.title,
            body: occurrence.quote ? quoteWithAttribution(occurrence.quote) : 'No quotes saved!',
            sound,
            // Spread conditionally so the empty-bank nudge carries no key at all
            // rather than `quoteId: undefined`, letting the tap handler's fallback
            // fire naturally. The payload is frozen into the OS at schedule time
            // and read back by whatever build is installed a fortnight later, so
            // `authorId` rides along unused today instead of making a future
            // version wait for old payloads to drain.
            ...(occurrence.quote ? { data: { quoteId: occurrence.quote.id, authorId: occurrence.quote.authorId } } : {}),
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: occurrence.when, channelId: 'daily-quotes' },
        });
        scheduled++;
        // Only a real quote extends the covered run. The empty-bank nudge is
        // scheduled the same way but covers nothing, and following it with a
        // "your quotes have paused" reminder would be telling someone with no
        // saved quotes that their quotes stopped.
        if (occurrence.quote) through = day;
      }
    }
    if (through) await scheduleTopUpReminder(through, mainTime, sound, now);
  } catch {
    // scheduling failures must not block UI
  }
  return { through, truncated, scheduled };
}

/**
 * One notification on the first uncovered morning, telling the user to open the app.
 *
 * The rotation is written out in advance and only ever topped back up when the
 * app is launched, so a user who stops opening it stops receiving quotes — after
 * the horizon with no extras, and sooner once the budget is being split across
 * extra slots. Nothing about that is visible from the outside: the notifications
 * simply stop.
 *
 * This converts that silent stop into a recoverable one. It fires at the daily
 * delivery time on the day after the last covered one — the exact moment a quote
 * was expected and will not arrive.
 */
async function scheduleTopUpReminder(through: Date, mainTime: NotificationTime, sound: boolean, now: Date): Promise<void> {
  const when = new Date(through);
  when.setDate(when.getDate() + 1);
  const at = new Date(when);
  at.setHours(mainTime.hour, mainTime.minute, 0, 0);
  if (at <= now) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your quotes have paused',
      body: 'Open Quoted to line up the next run of daily quotes.',
      sound,
      // No quoteId: there is no quote behind this one, so the tap handler's
      // fallback opens the app on today's, which is what someone re-opening
      // after a lapse wants to see anyway.
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'daily-quotes' },
  });
}
