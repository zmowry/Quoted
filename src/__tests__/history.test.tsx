import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { STORAGE_KEYS } from '@/src/services/storage';
import { dateKey } from '@/src/services/queueManager';
import { flushPending, renderWithProviders } from '@/src/test-utils';
import HistoryScreen from '../../app/history';
import QuoteBankScreen from '../../app/(tabs)/index';
import { AuthorDetail } from '../../app/(tabs)/authors/[authorId]';

const BICYCLE = 'Life is like riding a bicycle. To keep your balance, you must keep moving.';
const IMAGINATION = 'Imagination is more important than knowledge.';

/**
 * Saves one quote and mounts the bank once, which is what drives planRotation to
 * write the day assignments that history reads back.
 */
async function seedAndPlan(): Promise<void> {
  const author = renderWithProviders(<AuthorDetail authorId="einstein" />);
  await screen.findByLabelText(`Save ${BICYCLE}`);
  fireEvent.press(screen.getByLabelText(`Save ${BICYCLE}`));
  await screen.findByLabelText(`Remove ${BICYCLE}`);
  author.unmount();

  const bank = renderWithProviders(<QuoteBankScreen />);
  await screen.findByText('My saved quotes');
  await flushPending();
  bank.unmount();
}

async function openHistory(): Promise<void> {
  renderWithProviders(<HistoryScreen />);
  await flushPending();
}

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });

describe('Quote history', () => {
  it('lists a quote delivered today', async () => {
    await seedAndPlan();
    await openHistory();
    await waitFor(() => expect(screen.getByText(`"${BICYCLE}"`)).toBeTruthy());
    expect(screen.getByText(/Today · Daily quote/)).toBeTruthy();
  });

  it('shows only days that have happened, not the planned horizon', async () => {
    // With one quote in the bank the 14-day plan assigns it to 14 separate days,
    // so a screen missing the `<= today` filter renders 14 rows here. This is the
    // single most important assertion in the feature.
    await seedAndPlan();
    await openHistory();
    await waitFor(() => expect(screen.getAllByText(`"${BICYCLE}"`)).toHaveLength(1));
  });

  it('accounts for a delivered quote that has since been removed', async () => {
    // Seeded as a PAST day on purpose. A dangling assignment for today or later is
    // repaired rather than left: quoteForDate redraws a slot whose quote has gone,
    // and resetPlanFrom only discards the future. So an unresolvable slot is
    // exactly a past one, which nothing ever revisits.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await AsyncStorage.setItem(STORAGE_KEYS.quotes, JSON.stringify([
      { id: 'einstein-1', text: BICYCLE, authorId: 'einstein', authorName: 'Albert Einstein' },
    ]));
    await AsyncStorage.setItem(STORAGE_KEYS.assignments, JSON.stringify({
      [dateKey(yesterday)]: 'a-quote-since-deleted',
    }));

    await openHistory();
    // The screen owns up to the gap in one footnote rather than rendering a row it
    // cannot resolve.
    await waitFor(() => expect(screen.getByText(/1 earlier quote is not shown because you have removed it/)).toBeTruthy());
  });

  it('loses its record when the bank is emptied completely', async () => {
    // Documenting rather than endorsing: quoteForDate clears every assignment for
    // an empty bank (queueManager.ts), so the last delete takes the history with
    // it. Left alone deliberately — a read-only screen is no reason to reshape the
    // scheduler — but pinned here so the behaviour is a decision, not a surprise.
    await seedAndPlan();

    const bank = renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await flushPending();
    fireEvent.press(screen.getByLabelText(`Delete ${BICYCLE}`));
    await flushPending();
    bank.unmount();

    await openHistory();
    await screen.findByText('No history yet');
  });

  it('explains itself when nothing has been delivered', async () => {
    await openHistory();
    await screen.findByText('No history yet');
  });

  it('is a record rather than a place to edit the bank', async () => {
    await seedAndPlan();
    await openHistory();
    await waitFor(() => expect(screen.getByText(`"${BICYCLE}"`)).toBeTruthy());
    expect(screen.queryByLabelText(/^Delete /)).toBeNull();
    expect(screen.queryByLabelText(/^Edit /)).toBeNull();
    expect(screen.queryByLabelText('Add to collection')).toBeNull();
    // Copy survives, since wanting to reuse a quote you were sent is the point.
    expect(screen.getByLabelText('Copy quote')).toBeTruthy();
  });

  it('is reachable from the quote bank', async () => {
    renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    fireEvent.press(screen.getByLabelText('Quote history'));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/history'));
  });
});

describe('Delivery stats', () => {
  it('summarises a first delivery above the list', async () => {
    await seedAndPlan();
    await openHistory();

    // Value and label are separate nodes, so the singular label is what proves
    // the count rather than a combined string.
    await screen.findByTestId('delivery-stats');
    expect(screen.getByText('day streak')).toBeTruthy();
    expect(screen.getByText('quote delivered')).toBeTruthy();
    expect(screen.getByText(/Best run in the last 21 days: 1 day/)).toBeTruthy();
    expect(screen.getByText(/Most delivered: Albert Einstein \(1\)/)).toBeTruthy();
  });

  it('reports cycle progress against the bank', async () => {
    await seedAndPlan();
    await openHistory();

    // One quote saved, one drawn for today.
    await screen.findByTestId('delivery-stats');
    expect(screen.getByText('1/1')).toBeTruthy();
    expect(screen.getByText('this cycle')).toBeTruthy();
  });

  it('stays hidden until something has actually been delivered', async () => {
    await openHistory();
    await screen.findByText('No history yet');
    expect(screen.queryByTestId('delivery-stats')).toBeNull();
  });

  // Emptying the bank deliberately wipes the assignments the stats are derived
  // from, so it takes the figures with it — the same rule the history list
  // already follows. That a *surviving* bank keeps its streak when one delivered
  // quote is deleted is covered deterministically in the queueManager tests,
  // where the day the quote fell on can be fixed rather than left to shuffle.
  it('goes with the record when the bank is emptied', async () => {
    await seedAndPlan();

    const bank = renderWithProviders(<QuoteBankScreen />);
    await screen.findByText('My saved quotes');
    await flushPending();
    fireEvent.press(screen.getByLabelText(`Delete ${BICYCLE}`));
    await flushPending();
    bank.unmount();

    await openHistory();
    await screen.findByText('No history yet');
    expect(screen.queryByTestId('delivery-stats')).toBeNull();
  });
});
