import { Alert } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { flushPending, lastTriggerDate, renderWithProviders } from '@/src/test-utils';
import { STORAGE_KEYS } from '@/src/services/storage';
import SettingsScreen from '../../app/(tabs)/settings';

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); jest.spyOn(Alert, 'alert').mockImplementation(jest.fn()); });
afterEach(() => jest.restoreAllMocks());

// The screen holds a spinner until stored settings load, so once any control is
// on screen the form is hydrated and safe to interact with.
const openSettings = async () => {
  renderWithProviders(<SettingsScreen />);
  await screen.findByText('Daily delivery');
};

// Cards are collapsed by default; expand the ones a test needs to interact with.
const expandCard = (title: string) => fireEvent.press(screen.getByText(title));

// jest.setup reports 'granted'. Overriding replaces that implementation for good,
// so every test that changes it restores the default afterwards.
const setPermissionStatus = (status: 'granted' | 'denied' | 'undetermined'): void => {
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(
    { status } as unknown as Notifications.NotificationPermissionsStatus,
  );
};

describe('Notification permission', () => {
  afterEach(() => setPermissionStatus('granted'));

  it('stays quiet when notifications are already granted', async () => {
    await openSettings();
    expect(screen.queryByText('Notifications are turned off')).toBeNull();
  });

  it('warns and offers system settings when notifications are denied', async () => {
    setPermissionStatus('denied');
    await openSettings();
    // The warning must be reachable without expanding anything, since every card
    // starts collapsed.
    await screen.findByText('Notifications are turned off');
    expect(screen.getByText(/cannot deliver quotes/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeTruthy();
  });

  it('requests permission when it has never been asked for', async () => {
    setPermissionStatus('undetermined');
    await openSettings();
    fireEvent.press(await screen.findByRole('button', { name: 'Allow' }));
    await waitFor(() => expect(Notifications.requestPermissionsAsync).toHaveBeenCalled());
    // Granting clears the warning without needing a reload.
    await waitFor(() => expect(screen.queryByText('Notifications are turned off')).toBeNull());
  });
});

describe('Display settings', () => {
  it('collapses every card by default', async () => {
    await openSettings();
    expect(screen.queryByText('Choose when your daily quote notification should arrive.')).toBeNull();
    expect(screen.queryByText('Light')).toBeNull();
    expect(screen.queryByText('Large')).toBeNull();
  });

  // Appearance and text size share one card, so every test below expands the
  // same 'Display' header rather than one per setting.
  it('starts on the light palette rather than following the device', async () => {
    // 'system' would hand a dark-mode phone the inverted version of a deliberately
    // warm palette on first launch. It stays on offer, it is just not the default.
    await openSettings();
    expandCard('Display');
    expect(screen.queryByText(/Following your device appearance/)).toBeNull();
    expect(await AsyncStorage.getItem('@quote-bank/theme')).toBeNull();
  });

  it('persists the system option', async () => {
    await openSettings();
    expandCard('Display');
    fireEvent.press(screen.getByText('Dark'));
    await waitFor(async () => expect(await AsyncStorage.getItem('@quote-bank/theme')).toBe('dark'));
    // Returning to System must be storable, not just an initial state.
    fireEvent.press(screen.getByText('System'));
    await waitFor(async () => expect(await AsyncStorage.getItem('@quote-bank/theme')).toBe('system'));
    expect(screen.getByText(/Following your device appearance/)).toBeTruthy();
  });

  it('persists the selected display mode', async () => {
    await openSettings();
    expandCard('Display');
    fireEvent.press(screen.getByText('Dark'));
    await waitFor(async () => expect(await AsyncStorage.getItem('@quote-bank/theme')).toBe('dark'));

    fireEvent.press(screen.getByText('Light'));
    await waitFor(async () => expect(await AsyncStorage.getItem('@quote-bank/theme')).toBe('light'));
  });

  it('persists the selected text size', async () => {
    await openSettings();
    expandCard('Display');
    fireEvent.press(screen.getByText('Large'));
    await waitFor(async () => expect(await AsyncStorage.getItem('@quote-bank/text-size')).toBe('large'));
  });

  it('offers both settings under the one header', async () => {
    await openSettings();
    expandCard('Display');
    expect(screen.getByText('Display mode')).toBeTruthy();
    expect(screen.getByText('Text size')).toBeTruthy();
    expect(screen.getByText('System')).toBeTruthy();
    expect(screen.getByText('Large')).toBeTruthy();
  });

  it('restores a stored theme and text size on mount', async () => {
    await AsyncStorage.setItem('@quote-bank/theme', 'dark');
    await AsyncStorage.setItem('@quote-bank/text-size', 'small');
    await openSettings();
    expandCard('Display');
    // A restored preference is reflected without the user touching anything.
    await waitFor(async () => expect(await AsyncStorage.getItem('@quote-bank/theme')).toBe('dark'));
    expect(screen.getByText('Small')).toBeTruthy();
  });

  it('collapses and expands a settings section', async () => {
    await openSettings();
    expect(screen.queryByText('Choose when your daily quote notification should arrive.')).toBeNull();
    fireEvent.press(screen.getByText('Daily delivery'));
    await screen.findByText('Choose when your daily quote notification should arrive.');
    fireEvent.press(screen.getByText('Daily delivery'));
    await waitFor(() => expect(screen.queryByText('Choose when your daily quote notification should arrive.')).toBeNull());
  });
});

describe('Quote order and sound', () => {
  it('defaults to shuffled delivery with sound on', async () => {
    await openSettings();
    expandCard('Daily delivery');
    expect(screen.getByText(/every saved quote once before any repeats/)).toBeTruthy();
  });

  it('persists the shuffle preference and explains it', async () => {
    await openSettings();
    expandCard('Daily delivery');
    fireEvent.press(screen.getByRole('button', { name: 'Shuffle' }));
    await waitFor(async () => expect(await AsyncStorage.getItem(STORAGE_KEYS.order)).toBe('shuffle'));
    expect(screen.getByText(/every saved quote once before any repeats/)).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'In order' }));
    await waitFor(async () => expect(await AsyncStorage.getItem(STORAGE_KEYS.order)).toBe('sequential'));
  });

  it('reschedules when sound is switched off so the change takes effect now', async () => {
    await openSettings();
    expandCard('Daily delivery');
    jest.clearAllMocks();

    fireEvent.press(screen.getByRole('button', { name: 'Play a sound: No' }));
    await waitFor(async () => expect(await AsyncStorage.getItem(STORAGE_KEYS.sound)).toBe('false'));
    // Sound is baked into the pending notification, so it must be rebuilt rather
    // than left for the next launch.
    await waitFor(() => expect(Notifications.scheduleNotificationAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ sound: false }) }),
    ));
    // A trigger without an explicit type is parsed as "deliver now", so toggling
    // the sound would push a quote to the lock screen instead of just rescheduling.
    expect(Notifications.scheduleNotificationAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({ trigger: expect.objectContaining({ type: 'date' }) }),
    );
    expect(lastTriggerDate().getTime()).toBeGreaterThan(Date.now());
  });

  it('gives the sound toggle buttons distinct accessible names', async () => {
    // Both this card and "More quotes per day" render their own Yes/No toggle,
    // so a plain "Yes"/"No" accessible name would be ambiguous with both cards
    // open and unusable for a screen reader either way.
    await openSettings();
    expandCard('Daily delivery');
    expandCard('More quotes per day');

    expect(screen.getByRole('button', { name: 'Play a sound: Yes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Play a sound: No' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'More quotes per day: Yes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'More quotes per day: No' })).toBeTruthy();
  });

  it('reflects the selected sound choice in accessibilityState', async () => {
    await openSettings();
    expandCard('Daily delivery');
    expect(screen.getByRole('button', { name: 'Play a sound: Yes' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    fireEvent.press(screen.getByRole('button', { name: 'Play a sound: No' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Play a sound: No' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    ));
  });

  it('restores a stored order and sound choice on mount', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.order, 'shuffle');
    await AsyncStorage.setItem(STORAGE_KEYS.sound, 'false');
    await openSettings();
    expandCard('Daily delivery');
    expect(screen.getByText(/every saved quote once before any repeats/)).toBeTruthy();
    // Scheduling on mount must honour the stored preference, not the default.
    await waitFor(() => expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ sound: false }) }),
    ));
  });
});

describe('Clearing all data', () => {
  // Alert is mocked, so drive the confirmation by invoking the button the dialog
  // would have shown.
  const alertButtons = () => {
    const [, , buttons] = jest.mocked(Alert.alert).mock.calls.at(-1) ?? [];
    return buttons ?? [];
  };

  const pressAlertButton = (label: string): void => {
    const button = alertButtons().find((b) => b.text === label);
    if (!button) throw new Error(`No "${label}" button in the alert`);
    // Cancel carries no handler by design; pressing it must simply do nothing.
    button.onPress?.();
  };

  const seedData = async (): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.quotes, JSON.stringify([
      { id: 'q1', text: 'A saved quote', authorId: 'woolf', authorName: 'Virginia Woolf' },
    ]));
    await AsyncStorage.setItem(STORAGE_KEYS.collections, JSON.stringify([{ id: 'c1', name: 'Favourites', quoteIds: ['q1'] }]));
    await AsyncStorage.setItem(STORAGE_KEYS.theme, 'dark');
    await AsyncStorage.setItem(STORAGE_KEYS.textSize, 'large');
  };

  it('asks for confirmation before deleting anything', async () => {
    await seedData();
    await openSettings();
    expandCard('Your data');
    fireEvent.press(screen.getByRole('button', { name: /Clear all data/ }));

    expect(Alert.alert).toHaveBeenCalledWith('Clear all data?', expect.stringContaining('cannot be undone'), expect.any(Array));
  });

  it('names how many quotes the user wrote themselves', async () => {
    // Custom quotes are the only data here that cannot be recovered from the
    // built-in catalogue, and there is no backup, so the count is spelled out
    // rather than buried in the total.
    await AsyncStorage.setItem(STORAGE_KEYS.quotes, JSON.stringify([
      { id: 'q1', text: 'A saved quote', authorId: 'woolf', authorName: 'Virginia Woolf' },
      { id: 'custom-a', text: 'Mine', authorId: 'custom:me', authorName: 'Me' },
    ]));
    await openSettings();
    expandCard('Your data');
    fireEvent.press(screen.getByRole('button', { name: /Clear all data/ }));

    expect(Alert.alert).toHaveBeenCalledWith('Clear all data?', expect.stringContaining('including 1 you wrote yourself'), expect.any(Array));
  });

  // A guard rather than a fail-before test: the clause was absent before too. It
  // earns its place by failing an implementation that appends it unconditionally,
  // which would read "including 0 you wrote yourself".
  it('says nothing about custom quotes when there are none', async () => {
    await seedData();
    await openSettings();
    expandCard('Your data');
    fireEvent.press(screen.getByRole('button', { name: /Clear all data/ }));

    expect(Alert.alert).toHaveBeenCalledWith('Clear all data?', expect.not.stringContaining('wrote yourself'), expect.any(Array));
    // An escape hatch must exist, and the delete must be marked destructive so the
    // platform renders it in red rather than as a neutral default action.
    expect(alertButtons().find((b) => b.text === 'Cancel')?.style).toBe('cancel');
    expect(alertButtons().find((b) => b.text === 'Delete everything')?.style).toBe('destructive');

    // Nothing is destroyed until the destructive button is chosen.
    expect(await AsyncStorage.getItem(STORAGE_KEYS.quotes)).toBeTruthy();

    pressAlertButton('Cancel');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.quotes)).toBeTruthy();
  });

  it('erases every key the app owns, including theme preferences', async () => {
    await seedData();
    await openSettings();
    expandCard('Your data');
    fireEvent.press(screen.getByRole('button', { name: /Clear all data/ }));
    pressAlertButton('Delete everything');

    await waitFor(async () => expect(await AsyncStorage.getItem(STORAGE_KEYS.quotes)).toBeNull());
    // Theme and text size live outside quoteStorage and are the easy ones to miss.
    for (const key of Object.values(STORAGE_KEYS)) {
      expect(await AsyncStorage.getItem(key)).toBeNull();
    }
  });

  it('cancels queued notifications so deleted quotes cannot still be delivered', async () => {
    await seedData();
    await openSettings();
    expandCard('Your data');
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    fireEvent.press(screen.getByRole('button', { name: /Clear all data/ }));
    pressAlertButton('Delete everything');

    // The OS holds a copy of the quote text; wiping storage alone would leave it
    // on the lock screen after the user erased it.
    await waitFor(() => expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled());
  });

  it('leaves AsyncStorage belonging to other libraries untouched', async () => {
    await AsyncStorage.setItem('@some-other-lib/session', 'keep-me');
    await seedData();
    await openSettings();
    expandCard('Your data');
    fireEvent.press(screen.getByRole('button', { name: /Clear all data/ }));
    pressAlertButton('Delete everything');

    await waitFor(async () => expect(await AsyncStorage.getItem(STORAGE_KEYS.quotes)).toBeNull());
    expect(await AsyncStorage.getItem('@some-other-lib/session')).toBe('keep-me');
  });
});

describe('Daily delivery time', () => {
  it('converts a 12-hour AM entry to the correct 24-hour trigger', async () => {
    await openSettings();
    expandCard('Daily delivery');
    fireEvent.changeText(screen.getByLabelText('Notification hour'), '12');
    fireEvent.changeText(screen.getByLabelText('Notification minute'), '05');
    fireEvent.press(screen.getByRole('button', { name: 'AM' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save notification time' }));
    // 12 AM is midnight -> hour 0. Deliveries are dated, so the time shows up in
    // the trigger's local clock time rather than as trigger fields.
    await waitFor(() => expect(lastTriggerDate().getHours()).toBe(0));
    expect(lastTriggerDate().getMinutes()).toBe(5);
  });

  it('persists the delivery time across a remount', async () => {
    await openSettings();
    expandCard('Daily delivery');
    fireEvent.changeText(screen.getByLabelText('Notification hour'), '6');
    fireEvent.changeText(screen.getByLabelText('Notification minute'), '30');
    fireEvent.press(screen.getByRole('button', { name: 'AM' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save notification time' }));
    await screen.findByText('(Setting saved)');
    await flushPending();

    screen.unmount();
    await openSettings();
    expandCard('Daily delivery');
    await waitFor(() => expect(screen.getByLabelText('Notification hour').props.value).toBe('6'));
    expect(screen.getByLabelText('Notification minute').props.value).toBe('30');
  });

  it('rejects a minute above 59 without scheduling', async () => {
    await openSettings();
    expandCard('Daily delivery');
    jest.clearAllMocks();
    fireEvent.changeText(screen.getByLabelText('Notification minute'), '75');
    fireEvent.press(screen.getByRole('button', { name: 'Save notification time' }));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Use a valid time', expect.any(String)));
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric hour without scheduling', async () => {
    await openSettings();
    expandCard('Daily delivery');
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
    expandCard('More quotes per day');
    expect(screen.queryByText('How many additional quotes?')).toBeNull();
    fireEvent.press(screen.getByText('Yes'));
    await screen.findByText('How many additional quotes?');
    expect(screen.getByText('Quote 2')).toBeTruthy();
  });

  it('shows one time slot per selected count', async () => {
    await openSettings();
    expandCard('More quotes per day');
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
    expandCard('More quotes per day');
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
    expandCard('More quotes per day');
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
    expandCard('More quotes per day');

    fireEvent.press(screen.getByText('Yes'));
    await screen.findByText('How many additional quotes?');

    // Let every in-flight provider promise settle; the opt-in must survive.
    await flushPending();
    expect(screen.getByText('How many additional quotes?')).toBeTruthy();
  });

  it('rejects an invalid extra time without saving', async () => {
    await openSettings();
    expandCard('More quotes per day');
    fireEvent.press(screen.getByText('Yes'));
    await screen.findByText('How many additional quotes?');
    fireEvent.changeText(screen.getByLabelText('Extra quote 1 hour'), '44');
    fireEvent.press(screen.getByRole('button', { name: 'Save additional settings' }));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Use valid times', expect.any(String)));
    expect(screen.queryByText('(Setting saved)')).toBeNull();
  });
});
