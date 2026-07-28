import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { renderWithProviders } from '@/src/test-utils';
import AuthorsScreen from '../../app/(tabs)/authors/index';
import { AuthorDetail } from '../../app/(tabs)/authors/[authorId]';

// These four all match "ma", and their last-name and first-name orderings differ.
const MA_AUTHORS = /^(Maya Angelou|Marcus Aurelius|Mark Twain|Martin Luther King Jr\.)$/;
const renderedNames = (): string[] => screen.getAllByText(MA_AUTHORS).map((node) => String(node.props.children));

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

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
