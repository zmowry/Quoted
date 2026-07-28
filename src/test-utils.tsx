import React from 'react';
import type { ReactElement, ReactNode } from 'react';
import { act, render } from '@testing-library/react-native';
import { QuoteBankProvider } from '@/src/hooks/useQuoteBank';
import { ThemeProvider } from '@/src/hooks/useTheme';

/** Mirrors app/_layout.tsx: every screen expects both providers above it. */
export function AppProviders({ children }: { children: ReactNode }): ReactElement {
  return <ThemeProvider><QuoteBankProvider>{children}</QuoteBankProvider></ThemeProvider>;
}

export const renderWithProviders = (ui: ReactElement) => render(ui, { wrapper: AppProviders });

/**
 * Yields to the macrotask queue so in-flight provider promise chains settle.
 * The provider mutations chain several awaits (storage -> queue -> notifications);
 * `waitFor` alone re-polls without letting those microtasks drain, so a press
 * followed immediately by an assertion can observe the pre-update tree.
 */
export const flushPending = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
