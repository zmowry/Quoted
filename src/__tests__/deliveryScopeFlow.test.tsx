import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { flushPending, renderWithProviders } from '@/src/test-utils';
import { STORAGE_KEYS } from '@/src/services/storage';
import QuoteBankScreen from '../../app/(tabs)/index';
import SettingsScreen from '../../app/(tabs)/settings';
import { AuthorDetail } from '../../app/(tabs)/authors/[authorId]';

const BICYCLE = 'Life is like riding a bicycle. To keep your balance, you must keep moving.';
const IMAGINATION = 'Imagination is more important than knowledge.';

const sheet = () => within(screen.getByTestId('collection-sheet'));

/**
 * Every scheduled notification that actually carries a quote.
 *
 * The run ends with a top-up reminder, which is not drawn from any pool and
 * fires at the daily delivery time — so it would otherwise fail every "these
 * bodies all came from the scoped collection" assertion below, and slip into
 * `scheduledBodiesAt` for the daily hour as well.
 */
const quoteCalls = () =>
  jest.mocked(Notifications.scheduleNotificationAsync).mock.calls
    .filter((call) => call[0].content.title !== 'Your quotes have paused');

/** Every quote body written into a currently-pending notification. */
const scheduledBodies = (): string[] => quoteCalls().map((call) => String(call[0].content.body));

/**
 * The bodies of the notifications scheduled for one hour of the day. The daily
 * quote and each extra slot fire at different times, so the hour is what tells
 * a slot's deliveries apart from the daily one.
 */
const scheduledBodiesAt = (hour: number): string[] =>
  quoteCalls()
    .filter((call) => (call[0].trigger as unknown as { date: Date }).date.getHours() === hour)
    .map((call) => String(call[0].content.body));

/**
 * Saves two Einstein quotes and files only the first into a new collection,
 * leaving the bank screen mounted.
 */
async function seedBankWithCollection(name: string): Promise<void> {
  const author = renderWithProviders(<AuthorDetail authorId="einstein" />);
  await screen.findByLabelText(`Save ${BICYCLE}`);
  fireEvent.press(screen.getByLabelText(`Save ${BICYCLE}`));
  await screen.findByLabelText(`Remove ${BICYCLE}`);
  fireEvent.press(screen.getByLabelText(`Save ${IMAGINATION}`));
  await screen.findByLabelText(`Remove ${IMAGINATION}`);
  author.unmount();

  const bank = renderWithProviders(<QuoteBankScreen />);
  await screen.findByText('My saved quotes');
  await waitFor(() => expect(screen.getAllByLabelText(/^Delete /i)).toHaveLength(2));

  fireEvent.press(screen.getAllByLabelText('Add to collection')[0]);
  await screen.findByTestId('collection-sheet');
  fireEvent.changeText(sheet().getByPlaceholderText('New collection name'), name);
  fireEvent.press(sheet().getByText('Add'));
  await waitFor(() => expect(sheet().getByText(name)).toBeTruthy());
  // Creating a collection leaves it empty; tapping its row is what files the
  // quote into it.
  fireEvent.press(sheet().getByText(name));
  await flushPending();
  bank.unmount();
}

const openDelivery = async (): Promise<void> => {
  renderWithProviders(<SettingsScreen />);
  await screen.findByText('Daily delivery');
  fireEvent.press(screen.getByText('Daily delivery'));
  await screen.findByText('Which quotes can be delivered?');
};

/**
 * Opens the additional-quotes card and turns on exactly one extra slot, which
 * fires at the default 12:00 — a different hour from the 09:00 daily quote, so
 * the two can be told apart in what gets scheduled.
 */
const enableOneExtra = async (): Promise<void> => {
  fireEvent.press(screen.getByText('More quotes per day'));
  await screen.findByLabelText('More quotes per day: Yes');
  fireEvent.press(screen.getByLabelText('More quotes per day: Yes'));
  await screen.findByTestId('extra-count');
  fireEvent.press(within(screen.getByTestId('extra-count')).getByText('1'));
  await screen.findByTestId('slot-collections-0');
};

const saveExtras = async (): Promise<void> => {
  fireEvent.press(screen.getByText('Save additional settings'));
  await flushPending();
};

const slotChip = (slot: number, label: string) =>
  within(screen.getByTestId(`slot-collections-${slot}`)).getByLabelText(`Quote ${slot + 2} from: ${label}`);

const LUCK = 'Luck is what happens when preparation meets opportunity.';

/**
 * Saves one Einstein quote and one Seneca quote, so the bank spans two
 * disjoint-enough theme sets: Einstein carries humor and not stoicism, Seneca
 * the reverse. Both carry wisdom, which is what makes a shared theme testable.
 */
async function seedTwoAuthors(): Promise<void> {
  const einstein = renderWithProviders(<AuthorDetail authorId="einstein" />);
  await screen.findByLabelText(`Save ${BICYCLE}`);
  fireEvent.press(screen.getByLabelText(`Save ${BICYCLE}`));
  await screen.findByLabelText(`Remove ${BICYCLE}`);
  einstein.unmount();

  const seneca = renderWithProviders(<AuthorDetail authorId="seneca" />);
  await screen.findByLabelText(`Save ${LUCK}`);
  fireEvent.press(screen.getByLabelText(`Save ${LUCK}`));
  await screen.findByLabelText(`Remove ${LUCK}`);
  seneca.unmount();
}

const themeChip = (label: string) =>
  within(screen.getByTestId('delivery-theme-chips')).getByLabelText(`Deliver from theme ${label}`);

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

describe('Theme-scoped delivery', () => {
  it('offers only themes the bank actually carries', async () => {
    await seedTwoAuthors();
    await openDelivery();

    expect(themeChip('Stoicism')).toBeTruthy();
    expect(themeChip('Humor')).toBeTruthy();
    // Nothing saved carries justice, and a scope matching nothing would fall
    // straight back to the whole bank the moment it was chosen.
    expect(within(screen.getByTestId('delivery-theme-chips')).queryByLabelText('Deliver from theme Justice')).toBeNull();
  });

  it('schedules only quotes carrying the chosen theme', async () => {
    await seedTwoAuthors();
    await openDelivery();

    fireEvent.press(themeChip('Stoicism'));
    await flushPending();
    jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
    fireEvent.press(themeChip('Stoicism'));
    await flushPending();

    const bodies = scheduledBodies();
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.every((body) => body.includes('Luck is what happens'))).toBe(true);
    expect(bodies.some((body) => body.includes('riding a bicycle'))).toBe(false);
  });

  it('persists the scope and reports what it is drawing from', async () => {
    await seedTwoAuthors();
    await openDelivery();

    fireEvent.press(themeChip('Humor'));
    await waitFor(async () => {
      const stored = JSON.parse(String(await AsyncStorage.getItem(STORAGE_KEYS.deliveryScope)));
      expect(stored).toEqual({ kind: 'theme', id: 'humor' });
    });
    expect(screen.getByText(/Delivering from 1 quote tagged Humor/)).toBeTruthy();
  });

  it('replaces a collection scope rather than stacking with it', async () => {
    // One scope, two ways of naming it: picking a theme has to clear the
    // collection radio, or the screen would show two selections and the pool
    // could only honour one of them.
    await seedBankWithCollection('Favourites');
    await openDelivery();

    fireEvent.press(screen.getByText('Favourites'));
    await flushPending();
    fireEvent.press(themeChip('Humor'));
    await flushPending();

    expect(screen.getByRole('button', { name: 'Favourites' })).toHaveAccessibilityState({ selected: false });
    expect(themeChip('Humor')).toHaveAccessibilityState({ selected: true });
  });

  it('widens back to the whole bank when nothing carries the theme any more', async () => {
    await seedTwoAuthors();
    await openDelivery();
    fireEvent.press(themeChip('Stoicism'));
    await flushPending();
    screen.unmount();

    // Deleting the only stoic quote leaves the scope pointing at nothing.
    const bank = renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    fireEvent.press(await screen.findByLabelText(`Delete ${LUCK}`));
    await flushPending();
    bank.unmount();

    await openDelivery();
    // Delivering nothing every morning would be the worse failure, so the pool
    // widens — and says so rather than leaving the fallback invisible.
    expect(screen.getByText(/Nothing in your bank carries that theme right now/)).toBeTruthy();
  });

  it('survives a remount', async () => {
    await seedTwoAuthors();
    await openDelivery();
    fireEvent.press(themeChip('Stoicism'));
    await flushPending();
    screen.unmount();

    await openDelivery();
    expect(themeChip('Stoicism')).toHaveAccessibilityState({ selected: true });
  });
});

describe('Collection-scoped delivery', () => {
  it('defaults to the whole bank', async () => {
    await seedBankWithCollection('Favourites');
    await openDelivery();

    expect(screen.getByText('All saved quotes')).toBeTruthy();
    expect(screen.getByText('Every quote in your bank is in the rotation.')).toBeTruthy();
  });

  it('prompts for a collection when none exist', async () => {
    renderWithProviders(<SettingsScreen />);
    await screen.findByText('Daily delivery');
    fireEvent.press(screen.getByText('Daily delivery'));
    await screen.findByText('Which quotes can be delivered?');

    expect(screen.getByText(/Create a collection in your quote bank/)).toBeTruthy();
  });

  it('persists the chosen collection', async () => {
    await seedBankWithCollection('Favourites');
    await openDelivery();

    fireEvent.press(screen.getByText('Favourites'));
    await waitFor(async () => {
      const stored = JSON.parse(String(await AsyncStorage.getItem(STORAGE_KEYS.deliveryScope)));
      expect(stored).toMatchObject({ kind: 'collection' });
    });
    expect(screen.getByText(/Delivering from 1 quote/)).toBeTruthy();
  });

  // The point of the feature: only the scoped quote should reach the OS.
  it('schedules only quotes from the chosen collection', async () => {
    await seedBankWithCollection('Favourites');
    await openDelivery();

    fireEvent.press(screen.getByText('Favourites'));
    await flushPending();

    jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
    // Re-selecting rebuilds the schedule, so the assertions see a clean run.
    fireEvent.press(screen.getByText('Favourites'));
    await flushPending();

    const bodies = scheduledBodies();
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.every((body) => body.includes('riding a bicycle'))).toBe(true);
    expect(bodies.some((body) => body.includes('Imagination is more important'))).toBe(false);
  });

  it('widens back to the whole bank when set to all quotes', async () => {
    await seedBankWithCollection('Favourites');
    await openDelivery();

    fireEvent.press(screen.getByText('Favourites'));
    await flushPending();
    fireEvent.press(screen.getByText('All saved quotes'));
    await flushPending();

    expect(await AsyncStorage.getItem(STORAGE_KEYS.deliveryCollection)).toBeNull();
    expect(screen.getByText('Every quote in your bank is in the rotation.')).toBeTruthy();
  });

  it('says so when the chosen collection has nothing in it', async () => {
    await seedBankWithCollection('Favourites');

    // Empty the collection by removing its only quote from the bank entirely.
    const bank = renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await waitFor(() => expect(screen.getAllByLabelText(/^Delete /i)).toHaveLength(2));
    fireEvent.press(screen.getByLabelText(`Delete ${BICYCLE}`));
    await flushPending();
    bank.unmount();

    await openDelivery();
    fireEvent.press(screen.getByText('Favourites'));
    await flushPending();

    expect(screen.getByText(/That collection has no saved quotes right now/)).toBeTruthy();
    // The fallback must still deliver something rather than going silent.
    expect(scheduledBodies().some((body) => body.includes('Imagination is more important'))).toBe(true);
  });
});

describe('Per-slot collections for extra quotes', () => {
  it('starts every slot on the daily scope rather than a collection', async () => {
    await seedBankWithCollection('Favourites');
    await openDelivery();
    await enableOneExtra();

    expect(slotChip(0, 'Same as daily')).toHaveAccessibilityState({ selected: true });
    expect(slotChip(0, 'Favourites')).toHaveAccessibilityState({ selected: false });
  });

  it('sends only that collection at the slot it is chosen for', async () => {
    await seedBankWithCollection('Favourites');
    await openDelivery();
    await enableOneExtra();

    fireEvent.press(slotChip(0, 'Favourites'));
    jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
    await saveExtras();

    // 12:00 is the slot; 09:00 is the daily quote, still drawing from the whole
    // bank, which is what makes this a scope on the slot rather than on delivery.
    const slotBodies = scheduledBodiesAt(12);
    expect(slotBodies.length).toBeGreaterThan(0);
    expect(slotBodies.every((body) => body.includes('riding a bicycle'))).toBe(true);
    expect(scheduledBodiesAt(9).some((body) => body.includes('Imagination is more important'))).toBe(true);
  });

  // "Same as daily" has to mean the daily scope, not the whole bank, or narrowing
  // delivery would silently leave the extras delivering everything.
  it('follows the daily scope when a slot is left alone', async () => {
    await seedBankWithCollection('Favourites');
    await openDelivery();

    fireEvent.press(screen.getByText('Favourites'));
    await flushPending();
    await enableOneExtra();

    jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
    await saveExtras();

    const slotBodies = scheduledBodiesAt(12);
    expect(slotBodies.length).toBeGreaterThan(0);
    expect(slotBodies.every((body) => body.includes('riding a bicycle'))).toBe(true);
  });

  it('remembers the choice across a remount', async () => {
    await seedBankWithCollection('Favourites');
    await openDelivery();
    await enableOneExtra();

    fireEvent.press(slotChip(0, 'Favourites'));
    await saveExtras();
    screen.unmount();

    await openDelivery();
    await enableOneExtra();
    expect(slotChip(0, 'Favourites')).toHaveAccessibilityState({ selected: true });
  });

  it('lets go of a collection that has since been deleted', async () => {
    await seedBankWithCollection('Favourites');
    await openDelivery();
    await enableOneExtra();
    fireEvent.press(slotChip(0, 'Favourites'));
    await saveExtras();
    screen.unmount();

    // Deleting happens in the quote bank, so the slot's reference has to be
    // cleared from there rather than only when settings is next opened.
    const bank = renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    fireEvent.press(screen.getAllByLabelText('Add to collection')[0]);
    await screen.findByTestId('collection-sheet');
    fireEvent.press(sheet().getByLabelText('Delete Favourites collection'));
    await flushPending();
    bank.unmount();

    const stored = JSON.parse(String(await AsyncStorage.getItem(STORAGE_KEYS.extra)));
    expect(stored.scopes.every((scope: unknown) => scope === null)).toBe(true);
  });

  // Offered on slots as well as on the daily scope: narrowing delivery to a
  // theme would otherwise leave the slots unable to say the same thing.
  it('scopes a slot to a theme', async () => {
    await seedTwoAuthors();
    await openDelivery();
    await enableOneExtra();

    fireEvent.press(slotChip(0, 'Stoicism'));
    jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
    await saveExtras();

    const slotBodies = scheduledBodiesAt(12);
    expect(slotBodies.length).toBeGreaterThan(0);
    expect(slotBodies.every((body) => body.includes('Luck is what happens'))).toBe(true);
  });

  it('remembers a theme slot across a remount', async () => {
    await seedTwoAuthors();
    await openDelivery();
    await enableOneExtra();

    fireEvent.press(slotChip(0, 'Stoicism'));
    await saveExtras();
    screen.unmount();

    await openDelivery();
    await enableOneExtra();
    expect(slotChip(0, 'Stoicism')).toHaveAccessibilityState({ selected: true });
  });
});
