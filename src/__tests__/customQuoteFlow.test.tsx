import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { flushPending, renderWithProviders } from '@/src/test-utils';
import { STORAGE_KEYS } from '@/src/services/storage';
import QuoteBankScreen from '../../app/(tabs)/index';
import { AuthorDetail } from '../../app/(tabs)/authors/[authorId]';

const BICYCLE = 'Life is like riding a bicycle. To keep your balance, you must keep moving.';
const MINE = 'The work is the reward.';

const sheet = () => within(screen.getByTestId('compose-sheet'));
const chips = () => within(screen.getByTestId('collection-chips'));

/** Opens the compose sheet and writes a quote into the bank. */
async function write(text: string, attribution = ''): Promise<void> {
  fireEvent.press(screen.getByLabelText('Write your own quote'));
  await screen.findByTestId('compose-sheet');
  fireEvent.changeText(sheet().getByLabelText('Quote text'), text);
  if (attribution) fireEvent.changeText(sheet().getByLabelText('Who said it'), attribution);
  fireEvent.press(sheet().getByText('Add to my bank'));
  await flushPending();
}

async function openBank(): Promise<void> {
  renderWithProviders(<QuoteBankScreen />);
  await screen.findByText('My saved quotes');
  await flushPending();
}

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

describe('Writing your own quote', () => {
  it('adds it to the bank', async () => {
    await openBank();
    await write(MINE, 'Ada Lovelace');
    await screen.findByLabelText(`Delete ${MINE}`);
    expect(screen.getByText('-- Ada Lovelace')).toBeTruthy();
  });

  it('is reachable from the empty bank, where it is the likeliest first action', async () => {
    await openBank();
    expect(screen.getByText('Your quote bank is empty')).toBeTruthy();
    expect(screen.getByLabelText('Write your own quote')).toBeTruthy();
  });

  it('attributes a blank attribution to Anonymous', async () => {
    await openBank();
    await write(MINE);
    await screen.findByLabelText(`Delete ${MINE}`);
    expect(screen.getByText('-- Anonymous')).toBeTruthy();
  });

  it('refuses to submit an entry that is only whitespace', async () => {
    await openBank();
    fireEvent.press(screen.getByLabelText('Write your own quote'));
    await screen.findByTestId('compose-sheet');
    fireEvent.changeText(sheet().getByLabelText('Quote text'), '    ');
    fireEvent.press(sheet().getByText('Add to my bank'));
    await flushPending();
    // Still open, nothing saved.
    expect(screen.getByTestId('compose-sheet')).toBeTruthy();
    expect(screen.queryByLabelText(/^Delete /)).toBeNull();
  });

  it('caps an over-long entry', async () => {
    // fireEvent.changeText bypasses the native maxLength prop, so this only holds
    // because the cap is also applied in onChangeText.
    await openBank();
    await write('a'.repeat(400));
    await waitFor(() => expect(screen.getByLabelText(`Delete ${'a'.repeat(280)}`)).toBeTruthy());
  });

  it('delivers in a notification like any other quote', async () => {
    await openBank();
    (Notifications.scheduleNotificationAsync as jest.Mock).mockClear();
    await write(MINE, 'Ada Lovelace');
    await waitFor(() => expect((Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.length).toBeGreaterThan(0));
    const bodies = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map(([r]) => r.content.body);
    expect(bodies).toContain(`"${MINE}" -- Ada Lovelace`);
  });

  it('is found by searching its attribution', async () => {
    await openBank();
    await write(MINE, 'Ada Lovelace');
    await screen.findByLabelText(`Delete ${MINE}`);
    fireEvent.changeText(screen.getByLabelText('Search your quotes'), 'lovelace');
    await waitFor(() => expect(screen.getAllByLabelText(/^Delete /)).toHaveLength(1));
  });

  it('deletes through the shared undo path rather than a separate one', async () => {
    await openBank();
    await write(MINE, 'Ada Lovelace');
    await screen.findByLabelText(`Delete ${MINE}`);

    fireEvent.press(screen.getByLabelText(`Delete ${MINE}`));
    await flushPending();
    await screen.findByText('Quote removed');
    fireEvent.press(screen.getByLabelText('Undo delete'));
    await flushPending();
    await screen.findByLabelText(`Delete ${MINE}`);
  });
});

describe('A custom quote has no author page', () => {
  it('offers no author link, while a built-in quote still does', async () => {
    // Both halves asserted deliberately: before the guard existed the label did
    // not exist at all, so a lone toBeNull() on the custom quote would pass
    // vacuously. The built-in control is what makes this fail without the fix.
    const author = renderWithProviders(<AuthorDetail authorId="einstein" />);
    await screen.findByLabelText(`Save ${BICYCLE}`);
    fireEvent.press(screen.getByLabelText(`Save ${BICYCLE}`));
    await screen.findByLabelText(`Remove ${BICYCLE}`);
    author.unmount();

    await openBank();
    await write(MINE, 'Ada Lovelace');
    await screen.findByLabelText(`Delete ${MINE}`);

    expect(screen.getByLabelText('View quotes by Albert Einstein')).toBeTruthy();
    expect(screen.queryByLabelText('View quotes by Ada Lovelace')).toBeNull();
  });

  it('drops the banner\'s author link when a custom quote is the quote of the day', async () => {
    await openBank();
    await write(MINE, 'Ada Lovelace');
    // The only quote in the bank, so it must be the one on the banner.
    await waitFor(() => expect(screen.getByText(`“${MINE}”`)).toBeTruthy());
    expect(screen.queryByText('More from this author')).toBeNull();
  });

  it('renders a custom author group without navigation', async () => {
    await openBank();
    await write(MINE, 'Ada Lovelace');
    await screen.findByLabelText(`Delete ${MINE}`);
    fireEvent.press(screen.getByLabelText('Group by author'));
    // Matched by testID, not by name: the banner renders the author name too, so a
    // name lookup would be satisfied by the banner alone.
    await waitFor(() => expect(screen.getByTestId('author-group-custom:ada-lovelace')).toBeTruthy());
    expect(screen.queryByLabelText('View quotes by Ada Lovelace')).toBeNull();
  });

  it('groups quotes sharing an attribution and splits differing ones', async () => {
    // The whole justification for the per-attribution authorId scheme.
    await openBank();
    await write('First thought', 'Ada Lovelace');
    await screen.findByLabelText('Delete First thought');
    await write('Second thought', 'Ada Lovelace');
    await screen.findByLabelText('Delete Second thought');
    await write('Third thought', 'Grace Hopper');
    await screen.findByLabelText('Delete Third thought');

    fireEvent.press(screen.getByLabelText('Group by author'));
    // Three quotes, two attributions, so exactly two rows: the pair under one
    // attribution collapses while the other stays its own group.
    await waitFor(() => expect(screen.getAllByTestId(/^author-group-/)).toHaveLength(2));
    expect(screen.getByTestId('author-group-custom:ada-lovelace')).toBeTruthy();
    expect(screen.getByTestId('author-group-custom:grace-hopper')).toBeTruthy();
  });
});

describe('Editing your own quote', () => {
  it('rewrites it in place without creating a duplicate', async () => {
    // saveQuote dedupes by id and appends, so routing an edit through it would be
    // a silent no-op — this is the test that catches that.
    await openBank();
    await write(MINE, 'Ada Lovelace');
    await screen.findByLabelText(`Delete ${MINE}`);

    fireEvent.press(screen.getByLabelText(`Edit ${MINE}`));
    await screen.findByTestId('compose-sheet');
    fireEvent.changeText(sheet().getByLabelText('Quote text'), 'The work is its own reward.');
    fireEvent.press(sheet().getByText('Save changes'));
    await flushPending();

    await screen.findByLabelText('Delete The work is its own reward.');
    expect(screen.queryByLabelText(`Delete ${MINE}`)).toBeNull();
    expect(screen.getAllByLabelText(/^Delete /)).toHaveLength(1);
  });

  it('keeps the quote in its collections', async () => {
    // Guards against a delete-and-recreate implementation, which would change the
    // id and quietly drop the quote out of every collection it was filed under.
    await openBank();
    await write(MINE, 'Ada Lovelace');
    await screen.findByLabelText(`Delete ${MINE}`);

    fireEvent.press(screen.getByLabelText('Add to collection'));
    await screen.findByTestId('collection-sheet');
    const collectionSheet = within(screen.getByTestId('collection-sheet'));
    fireEvent.changeText(collectionSheet.getByPlaceholderText('New collection name'), 'Mine');
    fireEvent.press(collectionSheet.getByText('Add'));
    await waitFor(() => expect(collectionSheet.getByText('Mine')).toBeTruthy());
    fireEvent.press(collectionSheet.getByText('Mine'));
    fireEvent.press(collectionSheet.getByText('Done'));

    fireEvent.press(screen.getByLabelText(`Edit ${MINE}`));
    await screen.findByTestId('compose-sheet');
    fireEvent.changeText(sheet().getByLabelText('Quote text'), 'Reworded.');
    fireEvent.press(sheet().getByText('Save changes'));
    await flushPending();

    fireEvent.press(await chips().findByText('Mine'));
    await waitFor(() => expect(screen.getByLabelText('Delete Reworded.')).toBeTruthy());
  });

  it('offers no edit control on a built-in quote', async () => {
    const author = renderWithProviders(<AuthorDetail authorId="einstein" />);
    await screen.findByLabelText(`Save ${BICYCLE}`);
    fireEvent.press(screen.getByLabelText(`Save ${BICYCLE}`));
    await screen.findByLabelText(`Remove ${BICYCLE}`);
    author.unmount();

    await openBank();
    await write(MINE, 'Ada Lovelace');
    await screen.findByLabelText(`Delete ${MINE}`);

    // Built-in text is canonical; editing it would disagree with authorsData.
    expect(screen.getByLabelText(`Edit ${MINE}`)).toBeTruthy();
    expect(screen.queryByLabelText(`Edit ${BICYCLE}`)).toBeNull();
  });
});

describe('Tagging a quote you wrote', () => {
  /** Opens the compose sheet's theme grid, which starts collapsed. */
  const openThemes = async (): Promise<void> => {
    fireEvent.press(sheet().getByLabelText('Add themes'));
    await screen.findByLabelText('Theme Courage');
  };

  const storedQuotes = async (): Promise<{ text: string; themes?: string[] }[]> =>
    JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.quotes)) ?? '[]');

  it('saves the themes picked in the sheet', async () => {
    await openBank();
    fireEvent.press(screen.getByLabelText('Write your own quote'));
    await screen.findByTestId('compose-sheet');
    fireEvent.changeText(sheet().getByLabelText('Quote text'), MINE);
    await openThemes();
    fireEvent.press(sheet().getByLabelText('Theme Courage'));
    fireEvent.press(sheet().getByLabelText('Theme Purpose'));
    fireEvent.press(sheet().getByText('Add to my bank'));
    await flushPending();

    const [saved] = await storedQuotes();
    expect(saved.themes).toEqual(['courage', 'purpose']);
  });

  it('starts collapsed, so tagging is opt-in', async () => {
    // 21 chips open by default would bury the buttons under the keyboard for the
    // majority of quotes, which are written and saved without any tagging.
    await openBank();
    fireEvent.press(screen.getByLabelText('Write your own quote'));
    await screen.findByTestId('compose-sheet');
    expect(screen.queryByLabelText('Theme Courage')).toBeNull();
  });

  it('reopens an edited quote with its themes already showing', async () => {
    await openBank();
    fireEvent.press(screen.getByLabelText('Write your own quote'));
    await screen.findByTestId('compose-sheet');
    fireEvent.changeText(sheet().getByLabelText('Quote text'), MINE);
    await openThemes();
    fireEvent.press(sheet().getByLabelText('Theme Courage'));
    fireEvent.press(sheet().getByText('Add to my bank'));
    await flushPending();

    fireEvent.press(await screen.findByLabelText(`Edit ${MINE}`));
    await screen.findByTestId('compose-sheet');
    // Open without being asked, or the existing tags are invisible behind a
    // header the user has to think to press.
    expect(sheet().getByLabelText('Theme Courage').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
  });

  it('lets an edit remove the last theme', async () => {
    await openBank();
    fireEvent.press(screen.getByLabelText('Write your own quote'));
    await screen.findByTestId('compose-sheet');
    fireEvent.changeText(sheet().getByLabelText('Quote text'), MINE);
    await openThemes();
    fireEvent.press(sheet().getByLabelText('Theme Courage'));
    fireEvent.press(sheet().getByText('Add to my bank'));
    await flushPending();

    fireEvent.press(await screen.findByLabelText(`Edit ${MINE}`));
    await screen.findByTestId('compose-sheet');
    fireEvent.press(sheet().getByLabelText('Theme Courage'));
    fireEvent.press(sheet().getByText('Save changes'));
    await flushPending();

    const [saved] = await storedQuotes();
    expect(saved.themes).toBeUndefined();
  });

  it('does not leak themes from one compose into the next', async () => {
    await openBank();
    fireEvent.press(screen.getByLabelText('Write your own quote'));
    await screen.findByTestId('compose-sheet');
    fireEvent.changeText(sheet().getByLabelText('Quote text'), MINE);
    await openThemes();
    fireEvent.press(sheet().getByLabelText('Theme Courage'));
    fireEvent.press(sheet().getByText('Add to my bank'));
    await flushPending();

    await write('A second quote.');
    const saved = await storedQuotes();
    expect(saved.find((quote) => quote.text === 'A second quote.')?.themes).toBeUndefined();
  });
});
