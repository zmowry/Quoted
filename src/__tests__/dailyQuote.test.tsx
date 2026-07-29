import { Alert } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { shareAsync } from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { router } from 'expo-router';
import { flushPending, renderWithProviders } from '@/src/test-utils';
import QuoteBankScreen from '../../app/(tabs)/index';
import { AuthorDetail } from '../../app/(tabs)/authors/[authorId]';

const BICYCLE = 'Life is like riding a bicycle. To keep your balance, you must keep moving.';
const IMAGINATION = 'Imagination is more important than knowledge.';
const BICYCLE_ATTRIBUTED = `"${BICYCLE}" -- Albert Einstein`;

async function saveQuoteAndOpenBank(authorId: string, text: string): Promise<void> {
  const author = renderWithProviders(<AuthorDetail authorId={authorId} />);
  await screen.findByLabelText(`Save ${text}`);
  fireEvent.press(screen.getByLabelText(`Save ${text}`));
  await screen.findByLabelText(`Remove ${text}`);
  author.unmount();
  renderWithProviders(<QuoteBankScreen />);
  await screen.findByText('My saved quotes');
  await flushPending();
}

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); jest.spyOn(Alert, 'alert').mockImplementation(jest.fn()); });
afterEach(() => jest.restoreAllMocks());

describe('Quote of the day banner', () => {
  it('prompts the user when the bank is empty', async () => {
    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('No quotes saved!');
    expect(screen.getByText('Your quote bank is empty')).toBeTruthy();
    // Nothing to share or copy yet.
    expect(screen.queryByText('Share quote')).toBeNull();
    expect(screen.queryByText('Copy quote')).toBeNull();
  });

  it('promotes a saved quote into the banner', async () => {
    await saveQuoteAndOpenBank('einstein', BICYCLE);
    expect(screen.getByText('QUOTE OF THE DAY')).toBeTruthy();
    // The banner renders the quote in curly quotes, distinct from the card below.
    await waitFor(() => expect(screen.getByText(`“${BICYCLE}”`)).toBeTruthy());
    expect(screen.getByText('Share quote')).toBeTruthy();
  });

  it('copies the daily quote to the clipboard and confirms', async () => {
    await saveQuoteAndOpenBank('einstein', BICYCLE);
    fireEvent.press(screen.getByText('Copy quote'));
    // Attribution travels with the text; a pasted quote should not be anonymous.
    await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith(BICYCLE_ATTRIBUTED));
    await screen.findByText('Copied!');
  });

  it('captures the banner and hands the image to the share sheet', async () => {
    await saveQuoteAndOpenBank('einstein', BICYCLE);
    fireEvent.press(screen.getByText('Share quote'));
    await waitFor(() => expect(captureRef).toHaveBeenCalled());
    await waitFor(() => expect(shareAsync).toHaveBeenCalledWith(
      'file:///tmp/quote.png',
      expect.objectContaining({ mimeType: 'image/png' }),
    ));
  });

  it('stays usable and tells the user when sharing fails', async () => {
    (captureRef as jest.Mock).mockRejectedValueOnce(new Error('capture unavailable'));
    await saveQuoteAndOpenBank('einstein', BICYCLE);
    fireEvent.press(screen.getByText('Share quote'));
    await flushPending();
    // The control resets rather than sticking on "Preparing...", and the failure
    // is surfaced rather than swallowed — a silent no-op leaves the user unsure
    // whether they mis-tapped or the app is broken.
    await waitFor(() => expect(screen.getByText('Share quote')).toBeTruthy());
    expect(shareAsync).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Could not share', expect.any(String));
  });

  it('shows the same quote when the app is reopened later the same day', async () => {
    const author = renderWithProviders(<AuthorDetail authorId="einstein" />);
    await screen.findByLabelText(`Save ${BICYCLE}`);
    fireEvent.press(screen.getByLabelText(`Save ${BICYCLE}`));
    await screen.findByLabelText(`Remove ${BICYCLE}`);
    fireEvent.press(screen.getByLabelText(`Save ${IMAGINATION}`));
    await screen.findByLabelText(`Remove ${IMAGINATION}`);
    author.unmount();

    // Reopening used to advance the cycle, so the bank burned through a quote on
    // every launch while the pending notification still held the first one.
    for (let launch = 0; launch < 3; launch++) {
      const bank = renderWithProviders(<QuoteBankScreen />);
      await screen.findByText('My saved quotes');
      await flushPending();
      await waitFor(() => expect(screen.getByText(`“${BICYCLE}”`)).toBeTruthy());
      bank.unmount();
    }
  });

  it('advances to another quote when the user asks for a refresh', async () => {
    const author = renderWithProviders(<AuthorDetail authorId="einstein" />);
    await screen.findByLabelText(`Save ${BICYCLE}`);
    fireEvent.press(screen.getByLabelText(`Save ${BICYCLE}`));
    await screen.findByLabelText(`Remove ${BICYCLE}`);
    fireEvent.press(screen.getByLabelText(`Save ${IMAGINATION}`));
    await screen.findByLabelText(`Remove ${IMAGINATION}`);
    author.unmount();

    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await waitFor(() => expect(screen.getByText(`“${BICYCLE}”`)).toBeTruthy());
    // Holding a day's quote steady must not disable the explicit Refresh action.
    fireEvent.press(screen.getByText('Refresh'));
    await waitFor(() => expect(screen.getByText(`“${IMAGINATION}”`)).toBeTruthy());
  });

  it('links from the banner to the author detail route', async () => {
    await saveQuoteAndOpenBank('einstein', BICYCLE);
    fireEvent.press(screen.getByText('More from this author'));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/authors/einstein'));
  });
});

describe('Saved quote list', () => {
  it('copies an individual quote from its card', async () => {
    await saveQuoteAndOpenBank('einstein', BICYCLE);
    fireEvent.press(screen.getByLabelText('Copy quote'));
    await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith(BICYCLE_ATTRIBUTED));
  });

  it('groups saved quotes by author and back again', async () => {
    await saveQuoteAndOpenBank('einstein', BICYCLE);
    fireEvent.press(screen.getByLabelText('Group by author'));

    // Author view collapses the quotes into one row per author.
    await waitFor(() => expect(screen.queryByLabelText(`Delete ${BICYCLE}`)).toBeNull());
    expect(screen.getAllByText('Albert Einstein').length).toBeGreaterThan(0);

    fireEvent.press(screen.getByLabelText('Show all quotes'));
    await screen.findByLabelText(`Delete ${BICYCLE}`);
  });
});
