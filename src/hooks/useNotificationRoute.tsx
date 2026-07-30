import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

/**
 * Sends a tapped notification to the Quote Bank home screen, focused on the
 * quote that actually fired.
 *
 * `useLastNotificationResponse` is used rather than a plain listener
 * subscription because it also replays the tap that cold-started the app: when
 * the app was not running, the response arrives before any listener could have
 * been registered, and the tap would otherwise open the app to wherever it was
 * last left.
 */
export function useNotificationRoute(): void {
  const response = Notifications.useLastNotificationResponse();
  const routed = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Dismissing a notification, or acting on it from the tray, is not a request
    // to open the app.
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    // The same response keeps coming back on every render until another arrives,
    // so without remembering it a re-render would navigate all over again.
    const id = response.notification.request.identifier;
    if (routed.current === id) return;
    routed.current = id;
    // Optional chaining rather than a cast: a notification scheduled by an
    // earlier build carries no `data` at all, and the value crosses the OS
    // boundary untyped, so its shape is a claim rather than a guarantee.
    const data = response.notification.request.content?.data as { quoteId?: unknown } | undefined;
    const quoteId = typeof data?.quoteId === 'string' ? data.quoteId : undefined;
    router.navigate(quoteId ? `/?quote=${encodeURIComponent(quoteId)}` : '/');
  }, [response]);
}
