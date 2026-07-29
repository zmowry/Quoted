import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { flushPending, renderWithProviders } from '@/src/test-utils';
import QuoteBankScreen from '../../app/(tabs)/index';
import { AuthorDetail } from '../../app/(tabs)/authors/[authorId]';

const BICYCLE = 'Life is like riding a bicycle. To keep your balance, you must keep moving.';
const IMAGINATION = 'Imagination is more important than knowledge.';
const GETTING_STARTED = 'The secret of getting ahead is getting started.';

/** A collection name renders both in the sheet and in the filter chip row, so scope every lookup. */
const sheet = () => within(screen.getByTestId('collection-sheet'));
const chips = () => within(screen.getByTestId('collection-chips'));

/** Saves two Einstein quotes, then leaves the Quote Bank screen mounted. */
async function seedTwoQuotesAndOpenBank(): Promise<void> {
  const author = renderWithProviders(<AuthorDetail authorId="einstein" />);
  await screen.findByText('Albert Einstein');
  fireEvent.press(screen.getByLabelText(`Save ${BICYCLE}`));
  await screen.findByLabelText(`Remove ${BICYCLE}`);
  fireEvent.press(screen.getByLabelText(`Save ${IMAGINATION}`));
  await screen.findByLabelText(`Remove ${IMAGINATION}`);
  author.unmount();

  renderWithProviders(<QuoteBankScreen />);
  await screen.findByText('My saved quotes');
  await waitFor(() => expect(screen.getAllByLabelText(/^Delete /i)).toHaveLength(2));
}

/** Opens the sheet for the first saved quote and creates a collection in it. */
async function openSheetAndCreate(name: string): Promise<void> {
  fireEvent.press(screen.getAllByLabelText('Add to collection')[0]);
  await screen.findByTestId('collection-sheet');
  fireEvent.changeText(sheet().getByPlaceholderText('New collection name'), name);
  fireEvent.press(sheet().getByText('Add'));
  await waitFor(() => expect(sheet().getByText(name)).toBeTruthy());
}

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

describe('Collections', () => {
  it('creates a collection from the quote card sheet', async () => {
    await seedTwoQuotesAndOpenBank();
    fireEvent.press(screen.getAllByLabelText('Add to collection')[0]);
    await screen.findByTestId('collection-sheet');
    expect(sheet().getByText('No collections yet. Create one below.')).toBeTruthy();

    fireEvent.changeText(sheet().getByPlaceholderText('New collection name'), 'Motivation');
    fireEvent.press(sheet().getByText('Add'));

    await waitFor(() => expect(sheet().queryByText('No collections yet. Create one below.')).toBeNull());
    expect(sheet().getByText('Motivation')).toBeTruthy();
  });

  it('adds a quote to a collection and filters the bank down to it', async () => {
    await seedTwoQuotesAndOpenBank();
    await openSheetAndCreate('Motivation');

    // Tapping the row toggles membership for the tagged quote.
    fireEvent.press(sheet().getByText('Motivation'));
    fireEvent.press(sheet().getByText('Done'));

    fireEvent.press(await chips().findByText('Motivation'));

    await waitFor(() => expect(screen.getAllByLabelText(/^Delete /i)).toHaveLength(1));
    expect(screen.getByLabelText(`Delete ${BICYCLE}`)).toBeTruthy();
    expect(screen.queryByLabelText(`Delete ${IMAGINATION}`)).toBeNull();
  });

  it('removing a quote from a collection empties that filter', async () => {
    await seedTwoQuotesAndOpenBank();
    await openSheetAndCreate('Motivation');
    fireEvent.press(sheet().getByText('Motivation'));
    fireEvent.press(sheet().getByText('Done'));

    // Re-open for the same quote and toggle it back off.
    fireEvent.press(screen.getAllByLabelText('Add to collection')[0]);
    await screen.findByTestId('collection-sheet');
    fireEvent.press(sheet().getByText('Motivation'));
    fireEvent.press(sheet().getByText('Done'));

    fireEvent.press(await chips().findByText('Motivation'));
    await screen.findByText('No quotes in this collection');
  });

  it('persists collections across a remount', async () => {
    await seedTwoQuotesAndOpenBank();
    await openSheetAndCreate('Evening reads');
    fireEvent.press(sheet().getByText('Done'));

    screen.unmount();
    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await waitFor(() => expect(chips().getByText('Evening reads')).toBeTruthy());
  });

  it('deleting a collection drops its filter chip but keeps the quotes', async () => {
    await seedTwoQuotesAndOpenBank();
    await openSheetAndCreate('Temporary');

    fireEvent.press(sheet().getByLabelText('Delete Temporary collection'));
    await waitFor(() => expect(sheet().getByText('No collections yet. Create one below.')).toBeTruthy());
    fireEvent.press(sheet().getByText('Done'));

    await waitFor(() => expect(chips().queryByText('Temporary')).toBeNull());
    expect(screen.getAllByLabelText(/^Delete /i)).toHaveLength(2);
  });

  it('ignores an empty collection name', async () => {
    await seedTwoQuotesAndOpenBank();
    fireEvent.press(screen.getAllByLabelText('Add to collection')[0]);
    await screen.findByTestId('collection-sheet');

    fireEvent.changeText(sheet().getByPlaceholderText('New collection name'), '   ');
    fireEvent.press(sheet().getByText('Add'));

    await waitFor(() => expect(sheet().getByText('No collections yet. Create one below.')).toBeTruthy());
  });

  it('applies the selected collection to the author view as well', async () => {
    // The chips stay on screen when grouping by author, so the two views have to
    // agree about what is filtered; showing every author under a highlighted
    // chip reads as the filter having silently failed.
    const einstein = renderWithProviders(<AuthorDetail authorId="einstein" />);
    await screen.findByText('Albert Einstein');
    fireEvent.press(screen.getByLabelText(`Save ${BICYCLE}`));
    await screen.findByLabelText(`Remove ${BICYCLE}`);
    einstein.unmount();

    const twain = renderWithProviders(<AuthorDetail authorId="twain" />);
    await screen.findByText('Mark Twain');
    fireEvent.press(screen.getByLabelText(`Save ${GETTING_STARTED}`));
    await screen.findByLabelText(`Remove ${GETTING_STARTED}`);
    twain.unmount();

    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await waitFor(() => expect(screen.getAllByLabelText(/^Delete /i)).toHaveLength(2));

    // Collect only the Einstein quote, saved first and so listed first.
    fireEvent.press(screen.getAllByLabelText('Add to collection')[0]);
    await screen.findByTestId('collection-sheet');
    fireEvent.changeText(sheet().getByPlaceholderText('New collection name'), 'Motivation');
    fireEvent.press(sheet().getByText('Add'));
    await waitFor(() => expect(sheet().getByText('Motivation')).toBeTruthy());
    fireEvent.press(sheet().getByText('Motivation'));
    fireEvent.press(sheet().getByText('Done'));

    fireEvent.press(await chips().findByText('Motivation'));
    await waitFor(() => expect(screen.getAllByLabelText(/^Delete /i)).toHaveLength(1));
    fireEvent.press(screen.getByLabelText('Group by author'));

    await waitFor(() => expect(screen.queryByText('Mark Twain')).toBeNull());
    expect(screen.getAllByText('Albert Einstein').length).toBeGreaterThan(0);
  });

  it('shows the empty-collection message in the author view too', async () => {
    await seedTwoQuotesAndOpenBank();
    await openSheetAndCreate('Someday');
    fireEvent.press(sheet().getByText('Done'));

    fireEvent.press(await chips().findByText('Someday'));
    fireEvent.press(screen.getByLabelText('Group by author'));
    // Filtering the author list down to nothing must explain itself rather than
    // render a bare header.
    await screen.findByText('No quotes in this collection');
  });

  it('deleting a quote also removes it from its collections', async () => {
    await seedTwoQuotesAndOpenBank();
    await openSheetAndCreate('Motivation');
    fireEvent.press(sheet().getByText('Motivation'));
    fireEvent.press(sheet().getByText('Done'));

    fireEvent.press(await screen.findByLabelText(`Delete ${BICYCLE}`));
    await flushPending();
    await waitFor(() => expect(screen.queryByLabelText(`Delete ${BICYCLE}`)).toBeNull());

    fireEvent.press(await chips().findByText('Motivation'));
    await screen.findByText('No quotes in this collection');
  });
});

describe('Searching the quote bank', () => {
  it('filters the saved list down to quotes matching the search text', async () => {
    await seedTwoQuotesAndOpenBank();
    fireEvent.changeText(screen.getByLabelText('Search your quotes'), 'imagination');
    await waitFor(() => expect(screen.getAllByLabelText(/^Delete /i)).toHaveLength(1));
    expect(screen.getByLabelText(`Delete ${IMAGINATION}`)).toBeTruthy();
    expect(screen.queryByLabelText(`Delete ${BICYCLE}`)).toBeNull();
  });

  it('also matches on author name, not just quote text', async () => {
    const author = renderWithProviders(<AuthorDetail authorId="einstein" />);
    await screen.findByText('Albert Einstein');
    fireEvent.press(screen.getByLabelText(`Save ${BICYCLE}`));
    await screen.findByLabelText(`Remove ${BICYCLE}`);
    author.unmount();

    const twain = renderWithProviders(<AuthorDetail authorId="twain" />);
    await screen.findByText('Mark Twain');
    fireEvent.press(screen.getByLabelText(`Save ${GETTING_STARTED}`));
    await screen.findByLabelText(`Remove ${GETTING_STARTED}`);
    twain.unmount();

    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await waitFor(() => expect(screen.getAllByLabelText(/^Delete /i)).toHaveLength(2));

    fireEvent.changeText(screen.getByLabelText('Search your quotes'), 'twain');
    await waitFor(() => expect(screen.getAllByLabelText(/^Delete /i)).toHaveLength(1));
    expect(screen.getByLabelText(`Delete ${GETTING_STARTED}`)).toBeTruthy();
  });

  it('shows a search-specific empty message rather than the collection one', async () => {
    await seedTwoQuotesAndOpenBank();
    fireEvent.changeText(screen.getByLabelText('Search your quotes'), 'zzzzz');
    await screen.findByText('No quotes match your search');
    expect(screen.queryByText('No quotes in this collection')).toBeNull();
  });

  it('combines with the active collection filter', async () => {
    await seedTwoQuotesAndOpenBank();
    await openSheetAndCreate('Motivation');
    fireEvent.press(sheet().getByText('Motivation'));
    fireEvent.press(sheet().getByText('Done'));

    fireEvent.press(await chips().findByText('Motivation'));
    await waitFor(() => expect(screen.getAllByLabelText(/^Delete /i)).toHaveLength(1));
    expect(screen.getByLabelText(`Delete ${BICYCLE}`)).toBeTruthy();

    // Searching for the other, uncollected quote while this collection is active
    // must not resurrect it — both filters have to hold at once.
    fireEvent.changeText(screen.getByLabelText('Search your quotes'), 'imagination');
    await screen.findByText('No quotes match your search');
  });

  it('carries the search into the author-grouped view', async () => {
    await seedTwoQuotesAndOpenBank();
    fireEvent.changeText(screen.getByLabelText('Search your quotes'), 'zzzzz');
    fireEvent.press(screen.getByLabelText('Group by author'));
    await screen.findByText('No quotes match your search');
  });
});
