import { fireEvent, screen, within } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithProviders } from '@/src/test-utils';
import { authorsData } from '@/src/data/authorsData';
import { THEMES } from '@/src/data/themes';
import type { ThemeId } from '@/src/data/themes';
import AuthorsScreen from '../../app/(tabs)/authors/index';
import { AuthorDetail } from '../../app/(tabs)/authors/[authorId]';

const VOCABULARY = new Set<string>(THEMES.map((theme) => theme.id));
const chips = () => within(screen.getByTestId('theme-chips'));
const pickTheme = (label: string) => fireEvent.press(chips().getByLabelText(`Theme ${label}`));

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

describe('Theme data', () => {
  it('gives every author between 3 and 8 themes', () => {
    for (const author of authorsData) {
      expect(author.themes.length).toBeGreaterThanOrEqual(3);
      expect(author.themes.length).toBeLessThanOrEqual(8);
    }
  });

  it('draws every tag from the shared vocabulary', () => {
    for (const author of authorsData) {
      for (const theme of author.themes) expect(VOCABULARY.has(theme)).toBe(true);
    }
  });

  it('never repeats a theme within one author', () => {
    for (const author of authorsData) {
      expect(new Set(author.themes).size).toBe(author.themes.length);
    }
  });

  // A chip nothing is tagged with would filter to an empty list every time.
  it('leaves no theme in the vocabulary unused', () => {
    const used = new Set<ThemeId>(authorsData.flatMap((author) => author.themes));
    expect([...VOCABULARY].filter((theme) => !used.has(theme as ThemeId))).toEqual([]);
  });
});

/**
 * The list virtualises, so only the first ten authors by last name are mounted
 * on a full list. Maya Angelou and Marcus Aurelius sort first and second, which
 * is why they are the anchors here — an author further down (Seneca) is only
 * asserted on once a filter has shortened the list enough to reach them. Adding
 * authors moves everyone else in and out of that window, so nothing else may be
 * used as an unfiltered anchor.
 */
describe('Theme filtering', () => {
  it('narrows the author list to the chosen theme', async () => {
    renderWithProviders(<AuthorsScreen />);
    await screen.findByText('Marcus Aurelius');
    expect(screen.queryByText('Maya Angelou')).toBeTruthy();

    pickTheme('Stoicism');
    expect(screen.getByText('Marcus Aurelius')).toBeTruthy();
    expect(screen.getByText('Seneca')).toBeTruthy();
    expect(screen.queryByText('Maya Angelou')).toBeNull();
  });

  // Selecting more chips has to narrow, not widen, or the row reads as an OR.
  it('requires an author to carry every selected theme', async () => {
    renderWithProviders(<AuthorsScreen />);
    await screen.findByText('Marcus Aurelius');

    pickTheme('Stoicism');
    expect(screen.getByText('Seneca')).toBeTruthy();

    // Marcus Aurelius is tagged with action; Seneca is not.
    pickTheme('Action');
    expect(screen.getByText('Marcus Aurelius')).toBeTruthy();
    expect(screen.queryByText('Seneca')).toBeNull();
  });

  it('explains an over-narrowed filter instead of showing a blank list', async () => {
    renderWithProviders(<AuthorsScreen />);
    await screen.findByText('Marcus Aurelius');

    pickTheme('Stoicism');
    pickTheme('Humor');
    expect(screen.getByText(/No author covers Stoicism \+ Humor/)).toBeTruthy();
  });

  it('restores the full list when the filter is cleared', async () => {
    renderWithProviders(<AuthorsScreen />);
    await screen.findByText('Maya Angelou');

    pickTheme('Stoicism');
    expect(screen.queryByText('Maya Angelou')).toBeNull();

    fireEvent.press(screen.getByLabelText('Clear theme filters'));
    expect(screen.getByText('Maya Angelou')).toBeTruthy();
  });

  it('matches themes from the search box', async () => {
    renderWithProviders(<AuthorsScreen />);
    await screen.findByText('Marcus Aurelius');

    // 'stoicism' appears in neither Seneca's name nor his bio.
    fireEvent.changeText(screen.getByLabelText('Search authors'), 'stoicism');
    expect(screen.getByText('Seneca')).toBeTruthy();
    expect(screen.queryByText('Maya Angelou')).toBeNull();
  });
});

describe('Author detail', () => {
  it('lists the author\'s themes', async () => {
    renderWithProviders(<AuthorDetail authorId="seneca" />);
    await screen.findByText('Seneca');
    expect(screen.getByText('Stoicism')).toBeTruthy();
    expect(screen.getByText('Resilience')).toBeTruthy();
  });
});
