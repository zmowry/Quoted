import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { renderWithProviders } from '@/src/test-utils';
import { authorsData } from '@/src/data/authorsData';
import AuthorsScreen from '../../app/(tabs)/authors/index';
import { AuthorDetail } from '../../app/(tabs)/authors/[authorId]';

// These four all match "ma", and their last-name and first-name orderings differ.
const MA_AUTHORS = /^(Maya Angelou|Marcus Aurelius|Mark Twain|Martin Luther King Jr\.)$/;
const renderedNames = (): string[] => screen.getAllByText(MA_AUTHORS).map((node) => String(node.props.children));

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

describe('Author catalogue', () => {
  // Quote ids are the primary key for saved quotes, collections and the day
  // assignments history is read from, so a duplicate introduced while adding an
  // author would quietly merge two different quotes everywhere at once.
  it('gives every quote a unique id', () => {
    const ids = authorsData.flatMap((author) => author.quotes.map((quote) => quote.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every author a unique id', () => {
    const ids = authorsData.map((author) => author.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // authorById is how a saved quote finds its way back to an author page.
  it('files every quote under the author that owns it', () => {
    for (const author of authorsData) {
      for (const quote of author.quotes) expect(quote.authorId).toBe(author.id);
    }
  });
});

describe('Authors list', () => {
  it('filters the list by a case-insensitive search', async () => {
    renderWithProviders(<AuthorsScreen />);
    fireEvent.changeText(screen.getByLabelText('Search authors'), 'wool');
    await waitFor(() => expect(screen.getByText('Virginia Woolf')).toBeTruthy());
    expect(screen.queryByText('Albert Einstein')).toBeNull();
  });

  it('shows nothing when the search matches no author', async () => {
    renderWithProviders(<AuthorsScreen />);
    fireEvent.changeText(screen.getByLabelText('Search authors'), 'zzzzz');
    await waitFor(() => expect(screen.queryByText('Virginia Woolf')).toBeNull());
    expect(screen.queryByText('Albert Einstein')).toBeNull();
  });

  it('sorts by last name by default', async () => {
    renderWithProviders(<AuthorsScreen />);
    fireEvent.changeText(screen.getByLabelText('Search authors'), 'ma');
    await waitFor(() => expect(renderedNames().length).toBe(4));
    // Angelou, Aurelius, Jr., Twain
    expect(renderedNames()[0]).toBe('Maya Angelou');
  });

  it('re-sorts by first name when the sort toggle is switched', async () => {
    renderWithProviders(<AuthorsScreen />);
    fireEvent.changeText(screen.getByLabelText('Search authors'), 'ma');
    await waitFor(() => expect(renderedNames().length).toBe(4));

    fireEvent.press(screen.getByText('First Name'));
    // Marcus, Mark, Martin, Maya
    await waitFor(() => expect(renderedNames()[0]).toBe('Marcus Aurelius'));

    fireEvent.press(screen.getByText('Last Name'));
    await waitFor(() => expect(renderedNames()[0]).toBe('Maya Angelou'));
  });

  it('navigates to the author detail route when a row is tapped', async () => {
    renderWithProviders(<AuthorsScreen />);
    fireEvent.changeText(screen.getByLabelText('Search authors'), 'einstein');
    const row = await screen.findByText('Albert Einstein');
    fireEvent.press(row);
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/authors/einstein'));
  });

  it('finds a quote by its text even when the author name does not match', async () => {
    // Nothing in the author list matches "riding a bicycle", so without quote-text
    // search this phrase would surface no results at all.
    renderWithProviders(<AuthorsScreen />);
    fireEvent.changeText(screen.getByLabelText('Search authors'), 'riding a bicycle');
    await screen.findByText('Matching quotes');
    expect(screen.getByText(/riding a bicycle/)).toBeTruthy();
    expect(screen.getByText('-- Albert Einstein')).toBeTruthy();
    // The author itself did not match by name, so no separate author row for them.
    expect(screen.queryByText('Albert Einstein')).toBeNull();
  });

  it('navigates to the matched quote\'s author when its row is tapped', async () => {
    renderWithProviders(<AuthorsScreen />);
    fireEvent.changeText(screen.getByLabelText('Search authors'), 'riding a bicycle');
    fireEvent.press(await screen.findByText(/riding a bicycle/));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/authors/einstein'));
  });

  it('does not duplicate a quote as a match when its author already matched by name', async () => {
    // Einstein's own quotes should not also show up in the "Matching quotes"
    // section underneath his own author row.
    renderWithProviders(<AuthorsScreen />);
    fireEvent.changeText(screen.getByLabelText('Search authors'), 'einstein');
    await screen.findByText('Albert Einstein');
    expect(screen.queryByText('Matching quotes')).toBeNull();
  });

  it('sets a matched quote in a serif, keeping its italic', async () => {
    renderWithProviders(<AuthorsScreen />);
    fireEvent.changeText(screen.getByLabelText('Search authors'), 'riding a bicycle');
    // Both together: fontFamily + fontStyle is what resolves the real
    // Georgia-Italic face, so the italic is pinned against a careless overwrite.
    await waitFor(() => expect(screen.getByText(/riding a bicycle/)).toHaveStyle({ fontFamily: 'Georgia', fontStyle: 'italic' }));
  });

  it('shows no quote matches section for a search with no results', async () => {
    renderWithProviders(<AuthorsScreen />);
    fireEvent.changeText(screen.getByLabelText('Search authors'), 'zzzzz');
    await waitFor(() => expect(screen.queryByText('Matching quotes')).toBeNull());
  });
});

/** The surprise quote is random, so it is identified via its own save control. */
const surprisedText = (): string =>
  String(screen.getByLabelText(/^(Save|Remove) /).props.accessibilityLabel).replace(/^(Save|Remove) /, '');

describe('Surprise me', () => {
  it('shows nothing until the button is pressed', async () => {
    renderWithProviders(<AuthorsScreen />);
    await screen.findByLabelText('Surprise me');
    expect(screen.queryByLabelText('Dismiss surprise quote')).toBeNull();
  });

  it('surfaces a random quote from the full catalogue', async () => {
    renderWithProviders(<AuthorsScreen />);
    fireEvent.press(screen.getByLabelText('Surprise me'));

    await screen.findByLabelText('Dismiss surprise quote');
    // Whatever landed has to be a real quote with a real author attached.
    const text = surprisedText();
    const source = authorsData.find((a) => a.quotes.some((q) => q.text === text));
    expect(source).toBeTruthy();
    expect(screen.getByText(`-- ${source!.name}`)).toBeTruthy();
  });

  it('draws a different quote each time it is pressed', async () => {
    renderWithProviders(<AuthorsScreen />);
    fireEvent.press(screen.getByLabelText('Surprise me'));
    await screen.findByLabelText('Dismiss surprise quote');
    const first = surprisedText();

    // Re-rolling onto the quote already on screen would look like a dead button,
    // so the current pick is excluded from the draw rather than left to chance.
    fireEvent.press(screen.getByLabelText('Surprise me'));
    await waitFor(() => expect(surprisedText()).not.toBe(first));
  });

  it('saves the surprised quote into the bank', async () => {
    renderWithProviders(<AuthorsScreen />);
    fireEvent.press(screen.getByLabelText('Surprise me'));
    await screen.findByLabelText('Dismiss surprise quote');
    const text = surprisedText();

    fireEvent.press(screen.getByLabelText(`Save ${text}`));
    await screen.findByLabelText(`Remove ${text}`);
    expect(screen.getByText('- Remove')).toBeTruthy();
  });

  it('clears the card when dismissed', async () => {
    renderWithProviders(<AuthorsScreen />);
    fireEvent.press(screen.getByLabelText('Surprise me'));
    await screen.findByLabelText('Dismiss surprise quote');

    fireEvent.press(screen.getByLabelText('Dismiss surprise quote'));
    await waitFor(() => expect(screen.queryByLabelText('Dismiss surprise quote')).toBeNull());
    // The button itself stays, ready for another draw.
    expect(screen.getByLabelText('Surprise me')).toBeTruthy();
  });
});

describe('Author detail', () => {
  it('renders the author bio and every one of their quotes', async () => {
    renderWithProviders(<AuthorDetail authorId="woolf" />);
    await screen.findByText('Virginia Woolf');
    expect(screen.getByText(/A woman must have money and a room of her own/)).toBeTruthy();
    // woolf has 12 quotes, each with its own save control.
    expect(screen.getAllByLabelText(/^Save /i)).toHaveLength(12);
  });

  it('shows a not-found message for an unknown author id', async () => {
    renderWithProviders(<AuthorDetail authorId="nobody-here" />);
    await screen.findByText('Author not found.');
  });

  it('copies a quote with its author attached', async () => {
    renderWithProviders(<AuthorDetail authorId="woolf" />);
    await screen.findByText('Virginia Woolf');
    fireEvent.press(screen.getAllByLabelText('Copy quote')[0]);
    // Asserted by shape rather than a fixed quote so it does not depend on the
    // order of Woolf's quotes.
    await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
      expect.stringMatching(/^".+" -- Virginia Woolf$/),
    ));
  });

  it('toggles a quote between saved and unsaved', async () => {
    const text = 'I am rooted, but I flow.';
    renderWithProviders(<AuthorDetail authorId="woolf" />);
    await screen.findByText('Virginia Woolf');

    fireEvent.press(screen.getByLabelText(`Save ${text}`));
    await screen.findByLabelText(`Remove ${text}`);

    fireEvent.press(screen.getByLabelText(`Remove ${text}`));
    await screen.findByLabelText(`Save ${text}`);
  });
});
