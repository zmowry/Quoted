import { fireEvent, screen, within } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { flushPending, renderWithProviders } from '@/src/test-utils';
import { authorsData } from '@/src/data/authorsData';
import { STORAGE_KEYS } from '@/src/services/storage';
import { THEMES } from '@/src/data/themes';
import type { ThemeId } from '@/src/data/themes';
import QuoteBankScreen from '../../app/(tabs)/index';
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

/**
 * Seeded from three authors whose tags overlap in known ways:
 *   einstein  creativity wisdom change simplicity humor truth
 *   twain     humor wisdom courage truth change
 *   seneca    stoicism time wisdom resilience simplicity purpose
 * So 'stoicism' isolates Seneca, 'humor' catches two, 'wisdom' catches all
 * three, and no seeded author carries 'justice' or 'solitude'.
 */
describe('Filtering the bank by theme', () => {
  const EINSTEIN = 'Imagination rules the world.';
  const SENECA = 'We suffer more in imagination than in reality.';
  const TWAIN = 'Courage is resistance to fear.';
  const MINE = 'The work is the reward.';

  const seedBank = (extra: unknown[] = []) => AsyncStorage.setItem(STORAGE_KEYS.quotes, JSON.stringify([
    { id: 'e1', text: EINSTEIN, authorId: 'einstein', authorName: 'Albert Einstein' },
    { id: 's1', text: SENECA, authorId: 'seneca', authorName: 'Seneca' },
    { id: 't1', text: TWAIN, authorId: 'twain', authorName: 'Mark Twain' },
    ...extra,
  ]));

  const openBank = async (): Promise<void> => {
    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await flushPending();
  };

  const bankChips = () => within(screen.getByTestId('bank-theme-chips'));
  const pickBankTheme = (label: string) => fireEvent.press(bankChips().getByLabelText(`Theme ${label}`));
  const showing = (text: string) => screen.queryByLabelText(`Delete ${text}`) !== null;

  it('narrows the bank to the chosen theme', async () => {
    await seedBank();
    await openBank();

    pickBankTheme('Stoicism');
    expect(showing(SENECA)).toBe(true);
    expect(showing(EINSTEIN)).toBe(false);
    expect(showing(TWAIN)).toBe(false);
  });

  it('offers only themes the bank actually holds', async () => {
    // A chip for a theme nobody has saved could only ever empty the list.
    await seedBank();
    await openBank();

    expect(bankChips().getByLabelText('Theme Humor')).toBeTruthy();
    expect(bankChips().queryByLabelText('Theme Justice')).toBeNull();
  });

  it('requires a quote to carry every selected theme', async () => {
    await seedBank();
    await openBank();

    pickBankTheme('Humor');
    expect(showing(EINSTEIN)).toBe(true);
    expect(showing(TWAIN)).toBe(true);

    // Twain is tagged with courage; Einstein is not.
    pickBankTheme('Courage');
    expect(showing(TWAIN)).toBe(true);
    expect(showing(EINSTEIN)).toBe(false);
  });

  it('explains an over-narrowed filter rather than showing a blank list', async () => {
    await seedBank();
    await openBank();

    pickBankTheme('Stoicism');
    pickBankTheme('Humor');
    expect(screen.getByText('Nothing tagged Stoicism + Humor')).toBeTruthy();
  });

  it('restores the whole bank when the filter is cleared', async () => {
    await seedBank();
    await openBank();

    pickBankTheme('Stoicism');
    expect(showing(EINSTEIN)).toBe(false);

    fireEvent.press(screen.getByLabelText('Clear theme filters'));
    expect(showing(EINSTEIN)).toBe(true);
  });

  it('matches themes from the bank search box', async () => {
    await seedBank();
    await openBank();

    // 'stoicism' appears in neither the quote's text nor Seneca's name.
    fireEvent.changeText(screen.getByLabelText('Search your quotes'), 'stoicism');
    expect(showing(SENECA)).toBe(true);
    expect(showing(EINSTEIN)).toBe(false);
  });

  it('honours the themes on a quote the user wrote', async () => {
    // The case author-inherited themes cannot reach: a `custom:` authorId has no
    // author record, so its own tags are all it has.
    await seedBank([{ id: 'c1', text: MINE, authorId: 'custom:me', authorName: 'Me', themes: ['solitude'] }]);
    await openBank();

    pickBankTheme('Solitude');
    expect(showing(MINE)).toBe(true);
    expect(showing(SENECA)).toBe(false);
  });

  it('shows no theme row at all for an empty bank', async () => {
    await openBank();
    expect(screen.queryByTestId('bank-theme-chips')).toBeNull();
  });

  it('does not strand a filter whose last quote was deleted', async () => {
    // Deleting the only stoic quote takes its chip with it, leaving nothing to
    // press to turn the filter back off.
    await seedBank();
    await openBank();

    pickBankTheme('Stoicism');
    fireEvent.press(screen.getByLabelText(`Delete ${SENECA}`));
    await flushPending();

    expect(screen.queryByLabelText('Theme Stoicism')).toBeNull();
    expect(showing(EINSTEIN)).toBe(true);
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
