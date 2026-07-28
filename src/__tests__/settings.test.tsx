import { Alert } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { flushPending, renderWithProviders } from '@/src/test-utils';
import SettingsScreen from '../../app/(tabs)/settings';

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); jest.spyOn(Alert, 'alert').mockImplementation(jest.fn()); });
afterEach(() => jest.restoreAllMocks());

// The screen holds a spinner until stored settings load, so once any control is
// on screen the form is hydrated and safe to interact with.
const openSettings = async () => {
  renderWithProviders(<SettingsScreen />);
  await screen.findByText('Daily delivery');
};

describe('Display settings', () => {
  it('persists the selected display mode', async () => {
    await openSettings();
    fireEvent.press(screen.getByText('Dark'));
    await waitFor(async () => expect(await AsyncStorage.getItem('@quote-bank/theme')).toBe('dark'));

    fireEvent.press(screen.getByText('Light'));
    await waitFor(async () => expect(await AsyncStorage.getItem('@quote-bank/theme')).toBe('light'));
  });

  it('persists the selected text size', async () => {
    await openSettings();
    fireEvent.press(screen.getByText('Large'));
    await waitFor(async () => expect(await AsyncStorage.getItem('@quote-bank/text-size')).toBe('large'));
  });

  it('restores a stored theme and text size on mount', async () => {
    await AsyncStorage.setItem('@quote-bank/theme', 'dark');
    await AsyncStorage.setItem('@quote-bank/text-size', 'small');
    await openSettings();
    // A restored preference is reflected without the user touching anything.
    await waitFor(async () => expect(await AsyncStorage.getItem('@quote-bank/theme')).toBe('dark'));
    expect(screen.getByText('Small')).toBeTruthy();
  });

  it('collapses and expands a settings section', async () => {
    await openSettings();
    expect(screen.getByText('Choose when your daily quote notification should arrive.')).toBeTruthy();
    fireEvent.press(screen.getByText('Daily delivery'));
    await waitFor(() => expect(screen.queryByText('Choose when your daily quote notification should arrive.')).toBeNull());
    fireEvent.press(screen.getByText('Daily delivery'));
    await screen.findByText('Choose when your daily quote notification should arrive.');
  });
});

describe('Daily delivery time', () => {
  it('converts a 12-hour AM entry to the correct 24-hour trigger', async () => {
    await openSettings();
    fireEvent.changeText(screen.getByLabelText('Notification hour'), '12');
    fireEvent.changeText(screen.getByLabelText('Notification minute'), '05');
    fireEvent.press(screen.getByRole('button', { name: 'AM' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save notification time' }));
    // 12 AM is midnight -> hour 0.
    await waitFor(() => expect(Notifications.scheduleNotificationAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ trigger: expect.objectContaining({ hour: 0, minute: 5 }) }),
    ));
  });

  it('persists the delivery time across a remount', async () => {
    await openSettings();
    fireEvent.changeText(screen.getByLabelText('Notification hour'), '6');
    fireEvent.changeText(screen.getByLabelText('Notification minute'), '30');
    fireEvent.press(screen.getByRole('button', { name: 'AM' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save notification time' }));
    await screen.findByText('(Setting saved)');
    await flushPending();

    screen.unmount();
    await openSettings();
    await waitFor(() => expect(screen.getByLabelText('Notification hour').props.value).toBe('6'));
    expect(screen.getByLabelText('Notification minute').props.value).toBe('30');
  });

  it('rejects a minute above 59 without scheduling', async () => {
    await openSettings();
    jest.clearAllMocks();
    fireEvent.changeText(screen.getByLabelText('Notification minute'), '75');
    fireEvent.press(screen.getByRole('button', { name: 'Save notification time' }));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Use a valid time', expect.any(String)));
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric hour without scheduling', async () => {
    await openSettings();
    jest.clearAllMocks();
    fireEvent.changeText(screen.getByLabelText('Notification hour'), 'abc');
    fireEvent.press(screen.getByRole('button', { name: 'Save notification time' }));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Use a valid time', expect.any(String)));
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('Additional quotes per day', () => {
  it('reveals count and time pickers only after opting in', async () => {
    await openSettings();
    expect(screen.queryByText('How many additional quotes?')).toBeNull();
    fireEvent.press(screen.getByText('Yes'));
    await screen.findByText('How many additional quotes?');
    expect(screen.getByText('Quote 2')).toBeTruthy();
  });

  it('shows one time slot per selected count', async () => {
    await openSettings();
    fireEvent.press(screen.getByText('Yes'));
    await screen.findByText('How many additional quotes?');

    fireEvent.press(screen.getByText('4'));
    await screen.findByText('Quote 5');
    // Quotes 2..5 -> four slots.
    expect(screen.getByText('Quote 2')).toBeTruthy();
    expect(screen.queryByText('Quote 6')).toBeNull();
  });

  it('persists the opt-in and schedules the extra notifications', async () => {
    await openSettings();
    fireEvent.press(screen.getByText('Yes'));
    await screen.findByText('How many additional quotes?');
    fireEvent.press(screen.getByText('2'));
    fireEvent.press(screen.getByRole('button', { name: 'Save additional settings' }));
    await screen.findByText('(Setting saved)');

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem('@quote-bank/extra-quotes');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored as string)).toEqual(expect.objectContaining({ enabled: true, count: 2 }));
    });
  });

  it('restores a stored opt-in on remount', async () => {
    await AsyncStorage.setItem('@quote-bank/extra-quotes', JSON.stringify({
      enabled: true, count: 1, times: [{ hour: 13, minute: 15 }],
    }));
    await openSettings();
    await screen.findByText('How many additional quotes?');
    expect(screen.getByText('Quote 2')).toBeTruthy();
  });

  it('keeps a fast opt-in when the stored settings load lands afterwards', async () => {
    // Regression: the screen used to re-sync from the `additionalQuotes` context
    // object on every change. Because the provider hands back a fresh object once
    // its async load resolves, a toggle made before that point was silently reset.
    await AsyncStorage.setItem('@quote-bank/extra-quotes', JSON.stringify({
      enabled: false, count: 2, times: [{ hour: 12, minute: 0 }, { hour: 20, minute: 0 }],
    }));
    await openSettings();

    fireEvent.press(screen.getByText('Yes'));
    await screen.findByText('How many additional quotes?');

    // Let every in-flight provider promise settle; the opt-in must survive.
    await flushPending();
    expect(screen.getByText('How many additional quotes?')).toBeTruthy();
  });

  it('rejects an invalid extra time without saving', async () => {
    await openSettings();
    fireEvent.press(screen.getByText('Yes'));
    await screen.findByText('How many additional quotes?');
    fireEvent.changeText(screen.getByLabelText('Extra quote 1 hour'), '44');
    fireEvent.press(screen.getByRole('button', { name: 'Save additional settings' }));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Use valid times', expect.any(String)));
    expect(screen.queryByText('(Setting saved)')).toBeNull();
  });
});
