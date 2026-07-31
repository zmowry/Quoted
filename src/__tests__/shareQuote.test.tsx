import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shareAsync } from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { flushPending, renderWithProviders } from '@/src/test-utils';
import QuoteBankScreen from '../../app/(tabs)/index';
import { AuthorDetail } from '../../app/(tabs)/authors/[authorId]';

const BICYCLE = 'Life is like riding a bicycle. To keep your balance, you must keep moving.';

async function seedOneQuoteAndOpenBank(): Promise<void> {
  const author = renderWithProviders(<AuthorDetail authorId="einstein" />);
  await screen.findByLabelText(`Save ${BICYCLE}`);
  fireEvent.press(screen.getByLabelText(`Save ${BICYCLE}`));
  await screen.findByLabelText(`Remove ${BICYCLE}`);
  author.unmount();

  renderWithProviders(<QuoteBankScreen />);
  await screen.findByText('My saved quotes');
  await flushPending();
}

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

describe('Sharing a quote as an image', () => {
  it('captures and shares from any card in the bank', async () => {
    await seedOneQuoteAndOpenBank();

    fireEvent.press(screen.getByLabelText(`Share ${BICYCLE}`));
    await waitFor(() => expect(captureRef).toHaveBeenCalled());
    expect(shareAsync).toHaveBeenCalledWith('file:///tmp/quote.png', expect.objectContaining({ mimeType: 'image/png' }));
  });

  it('shares the quote-of-the-day banner through the same card', async () => {
    await seedOneQuoteAndOpenBank();

    fireEvent.press(screen.getByText('Share quote'));
    await waitFor(() => expect(captureRef).toHaveBeenCalled());
    expect(shareAsync).toHaveBeenCalledTimes(1);
  });

  // The capture surface is a single shared view, so a second press mid-capture
  // would otherwise photograph the wrong quote.
  it('ignores a second press while a capture is already in flight', async () => {
    await seedOneQuoteAndOpenBank();

    const button = screen.getByLabelText(`Share ${BICYCLE}`);
    fireEvent.press(button);
    fireEvent.press(button);
    await waitFor(() => expect(shareAsync).toHaveBeenCalled());
    expect(captureRef).toHaveBeenCalledTimes(1);
  });

  it('shares straight from an author page, without saving the quote first', async () => {
    // The author list is where a quote is met before it is anyone's, so sharing
    // must not require adding it to the bank.
    renderWithProviders(<AuthorDetail authorId="einstein" />);
    await screen.findByLabelText(`Share ${BICYCLE}`);

    fireEvent.press(screen.getByLabelText(`Share ${BICYCLE}`));
    await waitFor(() => expect(captureRef).toHaveBeenCalled());
    expect(shareAsync).toHaveBeenCalledWith('file:///tmp/quote.png', expect.objectContaining({ mimeType: 'image/png' }));
    expect(await AsyncStorage.getItem('@quote-bank/quotes')).toBeNull();
  });

  it('gives every quote on an author page its own copy and share control', async () => {
    renderWithProviders(<AuthorDetail authorId="einstein" />);
    await screen.findByText('Albert Einstein');
    // Einstein has 12 quotes; one of each per card, not one shared pair per page.
    expect(screen.getAllByLabelText('Copy quote')).toHaveLength(12);
    expect(screen.getAllByLabelText(/^Share /)).toHaveLength(12);
  });

  // The capture surface renders the quote text. Left mounted it would be a
  // permanent duplicate, breaking every other screen's getByText on that quote —
  // so it must be gone again once the share resolves.
  it('leaves no duplicate of the quote text behind afterwards', async () => {
    await seedOneQuoteAndOpenBank();
    const occurrences = () => screen.getAllByText(new RegExp(BICYCLE.slice(0, 24))).length;

    const before = occurrences();
    fireEvent.press(screen.getByLabelText(`Share ${BICYCLE}`));
    await waitFor(() => expect(shareAsync).toHaveBeenCalled());
    await flushPending();

    expect(occurrences()).toBe(before);
  });
});
