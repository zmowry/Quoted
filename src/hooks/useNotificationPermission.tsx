import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unknown';

const normalize = (status: string | undefined): PermissionStatus =>
  status === 'granted' || status === 'denied' || status === 'undetermined' ? status : 'unknown';

/**
 * Tracks whether the OS will actually deliver notifications.
 *
 * Without this the notification cards lie: scheduling fails silently inside
 * `scheduleAllNotifications`, so a user who denied the prompt still sees
 * "(Setting saved)" and never receives anything.
 *
 * Granting happens in system settings, outside the app, so the status is
 * re-read whenever the app returns to the foreground.
 */
export function useNotificationPermission(): {
  status: PermissionStatus;
  request: () => Promise<void>;
  openSystemSettings: () => Promise<void>;
} {
  const [status, setStatus] = useState<PermissionStatus>('unknown');
  const mounted = useRef(true);

  const check = useCallback(async (): Promise<void> => {
    try {
      const result = await Notifications.getPermissionsAsync();
      if (mounted.current) setStatus(normalize(result?.status));
    } catch {
      if (mounted.current) setStatus('unknown');
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void check();
    const sub = AppState.addEventListener('change', (next) => { if (next === 'active') void check(); });
    return () => { mounted.current = false; sub.remove(); };
  }, [check]);

  const request = useCallback(async (): Promise<void> => {
    try {
      const result = await Notifications.requestPermissionsAsync();
      if (mounted.current) setStatus(normalize(result?.status));
    } catch {
      // A denied prompt is a normal outcome, not an error worth surfacing.
    }
  }, []);

  const openSystemSettings = useCallback(async (): Promise<void> => {
    try { await Linking.openSettings(); } catch { }
  }, []);

  return { status, request, openSystemSettings };
}
