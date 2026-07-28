import '@testing-library/jest-native/extend-expect';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(async () => 'test-notification-id'),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const data = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => Promise.resolve(data.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => { data.set(key, value); return Promise.resolve(); }),
    removeItem: jest.fn((key: string) => { data.delete(key); return Promise.resolve(); }),
    clear: jest.fn(() => { data.clear(); return Promise.resolve(); }),
  };
});

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn(async () => undefined), isAvailableAsync: jest.fn(async () => true) }));
jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn(async () => 'file:///tmp/quote.png') }));

// Screens call router.push/replace directly; a stub keeps them renderable outside a navigator.
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
  return { router, useRouter: () => router, useLocalSearchParams: jest.fn(() => ({})), Stack: 'Stack', Tabs: 'Tabs', Link: 'Link' };
});
