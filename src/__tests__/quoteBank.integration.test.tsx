jest.mock('@react-native-async-storage/async-storage', () => {
  const data = new Map<string, string>();
  return { getItem: jest.fn((key: string) => Promise.resolve(data.get(key) ?? null)), setItem: jest.fn((key: string, value: string) => { data.set(key, value); return Promise.resolve(); }), clear: jest.fn(() => { data.clear(); return Promise.resolve(); }) };
});
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuoteBankProvider } from '@/src/hooks/useQuoteBank';
import QuoteBankScreen from '../../app/(tabs)/index';
import SettingsScreen from '../../app/(tabs)/settings';
import { AuthorDetail } from '../../app/(tabs)/authors/[authorId]';

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); jest.spyOn(Alert, 'alert').mockImplementation(jest.fn()); });
afterEach(() => jest.restoreAllMocks());
const Provider = ({ children }: { children: React.ReactNode }) => <QuoteBankProvider>{children}</QuoteBankProvider>;

describe('Quote Bank flows', () => {
  it('saves a quote from an author page, displays it in My Quote Bank, and makes it available to the queue', async () => {
    const author = render(<AuthorDetail authorId="einstein" />, { wrapper: Provider });
    await screen.findByText('Albert Einstein');
    fireEvent.press(screen.getByRole('button', { name: /Save Life is like riding/i }));
    await screen.findByText('Remove from My Bank');
    author.unmount();
    render(<QuoteBankScreen />, { wrapper: Provider });
    await waitFor(() => expect(screen.getAllByText(/Life is like riding a bicycle/).length).toBeGreaterThan(0));
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });
  it('deleting every quote shows empty UI and schedules the fallback notification', async () => {
    const view = render(<AuthorDetail authorId="wilde" />, { wrapper: Provider });
    await screen.findByText('Oscar Wilde');
    fireEvent.press(screen.getByRole('button', { name: /Save Be yourself/i }));
    await screen.findByText('Remove from My Bank'); view.unmount();
    render(<QuoteBankScreen />, { wrapper: Provider });
    const deleteButton = await screen.findByRole('button', { name: /Delete Be yourself/i }); fireEvent.press(deleteButton);
    await screen.findByText('Your quote bank is empty');
    await waitFor(() => expect(Notifications.scheduleNotificationAsync).toHaveBeenLastCalledWith(expect.objectContaining({ content: expect.objectContaining({ body: 'No quotes saved!' }) })));
  });
  it('changes delivery time and updates the scheduled notification trigger', async () => {
    render(<SettingsScreen />, { wrapper: Provider });
    await screen.findByText('Daily delivery');
    fireEvent.changeText(screen.getByLabelText('Notification hour'), '4');
    fireEvent.changeText(screen.getByLabelText('Notification minute'), '45');
    fireEvent.press(screen.getByRole('button', { name: 'PM' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save notification time' }));
    await waitFor(() => expect(Notifications.scheduleNotificationAsync).toHaveBeenLastCalledWith(expect.objectContaining({ trigger: expect.objectContaining({ hour: 16, minute: 45 }) })));
  });
});
