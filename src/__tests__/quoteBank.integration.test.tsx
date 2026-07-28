import { Alert } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithProviders } from '@/src/test-utils';
import QuoteBankScreen from '../../app/(tabs)/index';
import SettingsScreen from '../../app/(tabs)/settings';
import { AuthorDetail } from '../../app/(tabs)/authors/[authorId]';

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); jest.spyOn(Alert, 'alert').mockImplementation(jest.fn()); });
afterEach(() => jest.restoreAllMocks());

describe('Quote Bank flows', () => {
  it('saves a quote from an author page, displays it in My Quote Bank, and makes it available to the queue', async () => {
    const author = renderWithProviders(<AuthorDetail authorId="einstein" />);
    await screen.findByText('Albert Einstein');
    fireEvent.press(screen.getByRole('button', { name: /Save Life is like riding/i }));
    await screen.findByText('Remove from My Bank');
    author.unmount();
    renderWithProviders(<QuoteBankScreen />);
    await waitFor(() => expect(screen.getAllByText(/Life is like riding a bicycle/).length).toBeGreaterThan(0));
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  it('deleting every quote shows empty UI and schedules the fallback notification', async () => {
    const view = renderWithProviders(<AuthorDetail authorId="wilde" />);
    await screen.findByText('Oscar Wilde');
    fireEvent.press(screen.getByRole('button', { name: /Save Be yourself/i }));
    await screen.findByText('Remove from My Bank');
    view.unmount();
    renderWithProviders(<QuoteBankScreen />);
    const deleteButton = await screen.findByLabelText(/Delete Be yourself/i);
    fireEvent.press(deleteButton);
    await screen.findByText('Your quote bank is empty');
    await waitFor(() => expect(Notifications.scheduleNotificationAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ body: 'No quotes saved!' }) }),
    ));
  });

  it('changes delivery time and updates the scheduled notification trigger', async () => {
    renderWithProviders(<SettingsScreen />);
    await screen.findByText('Daily delivery');
    fireEvent.changeText(screen.getByLabelText('Notification hour'), '4');
    fireEvent.changeText(screen.getByLabelText('Notification minute'), '45');
    fireEvent.press(screen.getByRole('button', { name: 'PM' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save notification time' }));
    await waitFor(() => expect(Notifications.scheduleNotificationAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ trigger: expect.objectContaining({ hour: 16, minute: 45 }) }),
    ));
  });

  it('saving the same quote twice does not duplicate it in the bank', async () => {
    const author = renderWithProviders(<AuthorDetail authorId="twain" />);
    await screen.findByText('Mark Twain');
    const saveButton = screen.getAllByRole('button', { name: /^Save /i })[0];
    fireEvent.press(saveButton);
    await screen.findByText('Remove from My Bank');
    author.unmount();

    const again = renderWithProviders(<AuthorDetail authorId="twain" />);
    await screen.findByText('Mark Twain');
    // Already saved: the button is now a remove toggle, so the bank cannot gain a second copy.
    expect(again.getAllByText('Remove from My Bank')).toHaveLength(1);
    again.unmount();

    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await waitFor(() => expect(screen.getAllByLabelText(/^Delete /i)).toHaveLength(1));
  });

  it('rejects an out-of-range delivery time and leaves the schedule untouched', async () => {
    renderWithProviders(<SettingsScreen />);
    await screen.findByText('Daily delivery');
    jest.clearAllMocks();
    fireEvent.changeText(screen.getByLabelText('Notification hour'), '99');
    fireEvent.press(screen.getByRole('button', { name: 'Save notification time' }));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Use a valid time', expect.any(String)));
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
