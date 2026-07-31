import React from 'react';
import type { ReactElement, ReactNode } from 'react';
import { act, render } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { QuoteBankProvider } from '@/src/hooks/useQuoteBank';
import { QuoteShareProvider } from '@/src/hooks/useQuoteShare';
import { ThemeProvider } from '@/src/hooks/useTheme';

/** Mirrors app/_layout.tsx: every screen expects all three providers above it. */
export function AppProviders({ children }: { children: ReactNode }): ReactElement {
  return <ThemeProvider><QuoteBankProvider><QuoteShareProvider>{children}</QuoteShareProvider></QuoteBankProvider></ThemeProvider>;
}

export const renderWithProviders = (ui: ReactElement) => render(ui, { wrapper: AppProviders });

/**
 * Yields to the macrotask queue so in-flight provider promise chains settle.
 * The provider mutations chain several awaits (storage -> queue -> notifications);
 * `waitFor` alone re-polls without letting those microtasks drain, so a press
 * followed immediately by an assertion can observe the pre-update tree.
 */
export const flushPending = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });

/**
 * The trigger date of the most recently scheduled notification.
 *
 * Deliveries are dated one-offs, so the chosen clock time lives on the trigger's
 * date rather than in hour/minute fields. The cast narrows the trigger union,
 * which also covers the channel-only shape that carries no date.
 */
export const lastTriggerDate = (): Date => {
  const calls = jest.mocked(Notifications.scheduleNotificationAsync).mock.calls;
  return (calls.at(-1)![0].trigger as { date: Date }).date;
};
