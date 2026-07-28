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

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

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
    await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith(BICYCLE));
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

  it('stays usable when sharing fails', async () => {
    (captureRef as jest.Mock).mockRejectedValueOnce(new Error('capture unavailable'));
    await saveQuoteAndOpenBank('einstein', BICYCLE);
    fireEvent.press(screen.getByText('Share quote'));
    await flushPending();
    // The failure is swallowed and the control resets rather than sticking on "Preparing...".
    await waitFor(() => expect(screen.getByText('Share quote')).toBeTruthy());
    expect(shareAsync).not.toHaveBeenCalled();
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
    await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith(BICYCLE));
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
