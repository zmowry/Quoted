import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { flushPending, renderWithProviders } from '@/src/test-utils';
import QuoteBankScreen from '../../app/(tabs)/index';
import { AuthorDetail } from '../../app/(tabs)/authors/[authorId]';

/**
 * The banner when a tapped notification names a quote (`?quote=<id>`).
 *
 * Kept out of dailyQuote.test.tsx deliberately: these cases have to stub
 * `useLocalSearchParams`, and `jest.clearAllMocks()` clears recorded calls but
 * NOT a `mockReturnValue`, so a stray param would leak into every later test in
 * whichever file set it.
 */

const BICYCLE = 'Life is like riding a bicycle. To keep your balance, you must keep moving.';
const IMAGINATION = 'Imagination is more important than knowledge.';
const CURLY_BICYCLE = `“${BICYCLE}”`;
const CURLY_IMAGINATION = `“${IMAGINATION}”`;

const setParams = (params: { quote?: string }): void => {
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
};

/** Saves both Einstein quotes and leaves nothing mounted. */
async function seedTwoQuotes(): Promise<void> {
  const author = renderWithProviders(<AuthorDetail authorId="einstein" />);
  await screen.findByLabelText(`Save ${BICYCLE}`);
  fireEvent.press(screen.getByLabelText(`Save ${BICYCLE}`));
  await screen.findByLabelText(`Remove ${BICYCLE}`);
  fireEvent.press(screen.getByLabelText(`Save ${IMAGINATION}`));
  await screen.findByLabelText(`Remove ${IMAGINATION}`);
  author.unmount();
}

/**
 * Which quote the rotation gave today, and the id of the other one. Order is
 * shuffled by default, so neither can be hardcoded.
 */
async function todayAndOther(): Promise<{ today: string; otherText: string; otherId: string }> {
  const bank = renderWithProviders(<QuoteBankScreen />);
  await screen.findByText('My saved quotes');
  await flushPending();
  const today = screen.queryByText(CURLY_BICYCLE) ? CURLY_BICYCLE : CURLY_IMAGINATION;
  bank.unmount();
  return today === CURLY_BICYCLE
    ? { today, otherText: CURLY_IMAGINATION, otherId: 'einstein-2' }
    : { today, otherText: CURLY_BICYCLE, otherId: 'einstein-1' };
}

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });
// clearAllMocks leaves mockReturnValue in place, so it is reset explicitly.
afterEach(() => setParams({}));

describe('Quote focused by a notification tap', () => {
  it('shows the quote the notification carried rather than today\'s', async () => {
    await seedTwoQuotes();
    const { otherText, otherId } = await todayAndOther();

    setParams({ quote: otherId });
    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await flushPending();

    await waitFor(() => expect(screen.getByText(otherText)).toBeTruthy());
    // The kicker is the whole explanation for why this is not today's quote.
    expect(screen.getByText('FROM YOUR NOTIFICATION')).toBeTruthy();
    expect(screen.queryByText('QUOTE OF THE DAY')).toBeNull();
  });

  it('copies the focused quote, not the quote of the day', async () => {
    await seedTwoQuotes();
    const { otherId } = await todayAndOther();
    const otherRaw = otherId === 'einstein-2' ? IMAGINATION : BICYCLE;

    setParams({ quote: otherId });
    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await flushPending();

    fireEvent.press(screen.getByText('Copy quote'));
    await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith(`"${otherRaw}" -- Albert Einstein`));
  });

  it('returns to today\'s quote on request, restoring Refresh', async () => {
    await seedTwoQuotes();
    const { today, otherText, otherId } = await todayAndOther();

    setParams({ quote: otherId });
    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await flushPending();
    await waitFor(() => expect(screen.getByText(otherText)).toBeTruthy());

    fireEvent.press(screen.getByText('Show today\'s quote'));

    await waitFor(() => expect(screen.getByText(today)).toBeTruthy());
    expect(screen.getByText('QUOTE OF THE DAY')).toBeTruthy();
    expect(screen.getByText('Refresh')).toBeTruthy();
  });

  it('hides Refresh while a focused quote is shown', async () => {
    await seedTwoQuotes();
    const { otherId } = await todayAndOther();

    setParams({ quote: otherId });
    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await flushPending();

    // Refresh reassigns today's slot, so leaving it here would burn a quote
    // off-screen and appear to do nothing.
    expect(screen.queryByText('Refresh')).toBeNull();
    expect(screen.getByText('Show today\'s quote')).toBeTruthy();
  });

  it('falls back to today\'s quote when the focused id no longer exists', async () => {
    // A guard, not a fail-before test: the pre-change screen always rendered
    // quoteOfDay, so this passes either way. It is kept because it fails the
    // plausible broken implementation — rendering `focused` with no `??` fallback,
    // which would leave the banner blank after the quote was deleted.
    await seedTwoQuotes();
    const { today } = await todayAndOther();

    setParams({ quote: 'deleted-long-ago' });
    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await flushPending();

    await waitFor(() => expect(screen.getByText(today)).toBeTruthy());
    expect(screen.getByText('QUOTE OF THE DAY')).toBeTruthy();
    expect(screen.queryByText('No quotes saved!')).toBeNull();
  });
});
