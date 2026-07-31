import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren, ReactElement } from 'react';
import { AppState } from 'react-native';
import type { AdditionalQuotesSettings, Collection, NotificationTime, Quote, QuoteBankContextValue, QuoteOrder } from '@/src/types';
import { isCustomQuote } from '@/src/customQuotes';
import { DEFAULT_EXTRA_QUOTES, DEFAULT_NOTIFICATION_TIME, DEFAULT_QUOTE_ORDER, DEFAULT_SOUND_ENABLED, quoteStorage } from '@/src/services/storage';
import { dateKey, extraSlotCount, planRotation, reassignDate, reconcileQueue, resetPlanFrom, rotationPools } from '@/src/services/queueManager';
import type { RotationPools } from '@/src/services/queueManager';
import { cancelAllNotifications, scheduleAllNotifications } from '@/src/services/notifications';

const QuoteBankContext = createContext<QuoteBankContextValue | undefined>(undefined);

/**
 * How far ahead the rotation is written out. Every launch tops this back up, so
 * it only has to cover the gap until the user next opens the app; the notifi-
 * cation budget in `scheduleAllNotifications` trims it further when extra
 * quotes per day are switched on.
 */
const SCHEDULE_HORIZON_DAYS = 14;

/**
 * How long a deleted quote stays recoverable. Deleting is otherwise permanent
 * and there is no backup, so a mis-tap on the trash icon costs the quote for
 * good; long enough to notice and react, short enough not to linger on screen.
 */
const UNDO_WINDOW_MS = 6000;

const uid = () => Math.random().toString(36).slice(2);

export function QuoteBankProvider({ children }: PropsWithChildren): ReactElement {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteOfDay, setQuoteOfDay] = useState<Quote>();
  const [notificationTime, setTime] = useState<NotificationTime>(DEFAULT_NOTIFICATION_TIME);
  const [additionalQuotes, setAdditionalQuotes] = useState<AdditionalQuotesSettings>(DEFAULT_EXTRA_QUOTES);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [quoteOrder, setQuoteOrder] = useState<QuoteOrder>(DEFAULT_QUOTE_ORDER);
  const [soundEnabled, setSoundEnabled] = useState(DEFAULT_SOUND_ENABLED);
  const [deliveryCollectionId, setDeliveryCollectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRemoved, setLastRemoved] = useState<Quote>();

  // The collections a removed quote belonged to are stripped on delete, so they
  // are held alongside it — restoring the quote without them would silently drop
  // whichever collections the user had filed it under.
  const removed = useRef<{ quote: Quote; collectionIds: string[] } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The day the current schedule was built for. Guards the foreground re-sync so
  // returning to the app repeatedly within one day does not churn the schedule.
  const syncedFor = useRef('');
  // Rebuilding the schedule cancels everything pending before re-adding it, so
  // two overlapping rebuilds would let the later cancel wipe the earlier's work.
  const pending = useRef<Promise<void>>(Promise.resolve());

  /**
   * Rewrites the rotation: assigns each of the next `SCHEDULE_HORIZON_DAYS`
   * calendar days a quote, points the banner at today's, and writes the whole
   * run out to the OS as one dated notification per day.
   */
  const syncSchedule = useCallback(async (
    pools: RotationPools, time: NotificationTime, extras: AdditionalQuotesSettings, order: QuoteOrder, sound: boolean,
  ): Promise<void> => {
    const run = async (): Promise<void> => {
      // An empty bank gets a short nudge rather than a fortnight of identical
      // ones — but it needs more than today, whose delivery time may already
      // have passed, leaving nothing scheduled at all.
      const plan = await planRotation(pools.main, order, {
        days: pools.main.length ? SCHEDULE_HORIZON_DAYS : 2,
        extras: extraSlotCount(extras),
        extraPools: pools.extras,
      });
      setQuoteOfDay(plan[0]?.quote);
      syncedFor.current = dateKey();
      await scheduleAllNotifications(time, plan, extras, { sound });
    };
    pending.current = pending.current.then(run, run);
    return pending.current;
  }, []);

  const clearUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = undefined;
    removed.current = null;
    setLastRemoved(undefined);
  }, []);

  // The window is held in a timer rather than checked on read, so the banner
  // clears itself instead of waiting for the next render to notice it expired.
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const refreshQuoteOfDay = useCallback(async () => {
    const pools = rotationPools(await quoteStorage.getQuotes(), collections, deliveryCollectionId, additionalQuotes);
    // An explicit refresh is the one case that should burn a quote. Replacing
    // today's also invalidates the days planned behind it, which would otherwise
    // be free to repeat the quote just drawn.
    await reassignDate(dateKey(), pools.main, quoteOrder);
    await resetPlanFrom(dateKey(), pools.all);
    await syncSchedule(pools, notificationTime, additionalQuotes, quoteOrder, soundEnabled);
  }, [collections, deliveryCollectionId, notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  useEffect(() => { void (async () => {
    try {
      const [storedQuotes, storedTime, storedExtra, storedCollections, storedOrder, storedSound, storedDelivery] = await Promise.all([
        quoteStorage.getQuotes(), quoteStorage.getNotificationTime(),
        quoteStorage.getAdditionalQuotes(), quoteStorage.getCollections(),
        quoteStorage.getQuoteOrder(), quoteStorage.getSoundEnabled(),
        quoteStorage.getDeliveryCollection(),
      ]);
      setQuotes(storedQuotes); setTime(storedTime); setAdditionalQuotes(storedExtra); setCollections(storedCollections);
      setQuoteOrder(storedOrder); setSoundEnabled(storedSound); setDeliveryCollectionId(storedDelivery);
      // Tops the horizon back up: days that have already been delivered are
      // spent, so every launch extends the run back out to its full length.
      await syncSchedule(rotationPools(storedQuotes, storedCollections, storedDelivery, storedExtra), storedTime, storedExtra, storedOrder, storedSound);
    } finally { setLoading(false); }
  })(); }, [syncSchedule]);

  // Days already delivered are gone from the plan, so returning to the app on a
  // later day is the moment to extend it again.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || loading) return;
      if (dateKey() === syncedFor.current) return;
      void (async () => {
        const latest = await quoteStorage.getQuotes();
        setQuotes(latest);
        await syncSchedule(rotationPools(latest, collections, deliveryCollectionId, additionalQuotes), notificationTime, additionalQuotes, quoteOrder, soundEnabled);
      })();
    });
    return () => sub.remove();
  }, [loading, collections, deliveryCollectionId, notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  const saveQuote = useCallback(async (quote: Quote) => {
    const next = await quoteStorage.saveQuote(quote);
    setQuotes(next);
    const pools = rotationPools(next, collections, deliveryCollectionId, additionalQuotes);
    await reconcileQueue(pools.all);
    // The rotation is already written out for the next fortnight, so without
    // discarding that plan a newly saved quote would not surface until it ran out.
    await resetPlanFrom(dateKey(), pools.all);
    await syncSchedule(pools, notificationTime, additionalQuotes, quoteOrder, soundEnabled);
  }, [collections, deliveryCollectionId, notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  const updateCustomQuote = useCallback(async (quote: Quote) => {
    // Only the user's own words are editable; a built-in quote's text is canonical
    // and editing it would silently disagree with authorsData.
    if (!isCustomQuote(quote)) return;
    const next = await quoteStorage.updateQuote(quote);
    setQuotes(next);
    const pools = rotationPools(next, collections, deliveryCollectionId, additionalQuotes);
    // No reconcileQueue: the id set is unchanged. But every planned day still
    // holds the OLD text inside the OS, so the run is discarded and rewritten or
    // the edit would not reach a notification for a fortnight.
    await resetPlanFrom(dateKey(), pools.all);
    await syncSchedule(pools, notificationTime, additionalQuotes, quoteOrder, soundEnabled);
  }, [collections, deliveryCollectionId, notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  const removeQuote = useCallback(async (id: string) => {
    const doomed = quotes.find((q) => q.id === id);
    const filedUnder = collections.filter((c) => c.quoteIds.includes(id)).map((c) => c.id);
    const next = await quoteStorage.deleteQuote(id);
    setQuotes(next);
    // Membership is stripped below, but the deleted quote is already absent from
    // `next`, so the pools are correct without waiting for that.
    const pools = rotationPools(next, collections, deliveryCollectionId, additionalQuotes);
    await reconcileQueue(pools.all);
    // Every planned day still carries the deleted quote's text in the OS, so the
    // whole run is discarded and re-drawn from what is left.
    await resetPlanFrom(dateKey(), pools.all);
    await syncSchedule(pools, notificationTime, additionalQuotes, quoteOrder, soundEnabled);
    // remove from all collections
    const updated = collections.map((c) => ({ ...c, quoteIds: c.quoteIds.filter((qid) => qid !== id) }));
    setCollections(updated); await quoteStorage.setCollections(updated);
    // Only the most recent delete is recoverable; a second one replaces the first
    // rather than queueing, so undo always means "the one you just did".
    if (doomed) {
      if (undoTimer.current) clearTimeout(undoTimer.current);
      removed.current = { quote: doomed, collectionIds: filedUnder };
      setLastRemoved(doomed);
      undoTimer.current = setTimeout(() => { removed.current = null; setLastRemoved(undefined); }, UNDO_WINDOW_MS);
    }
  }, [collections, deliveryCollectionId, quotes, notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  const undoRemove = useCallback(async () => {
    const pending = removed.current;
    if (!pending) return;
    // Cleared up front so a double-tap on Undo cannot restore the quote twice.
    clearUndo();
    const next = await quoteStorage.saveQuote(pending.quote);
    setQuotes(next);
    // Membership is restored *before* the pool is computed: if the quote belongs
    // to the delivery collection, scheduling against the pre-undo collections
    // would leave it out of the rotation until something else forced a re-sync.
    // A collection deleted during the undo window is simply gone; the quote comes
    // back to whichever of its collections still exist.
    const restored = pending.collectionIds.length
      ? collections.map((c) => pending.collectionIds.includes(c.id) && !c.quoteIds.includes(pending.quote.id)
        ? { ...c, quoteIds: [...c.quoteIds, pending.quote.id] }
        : c)
      : collections;
    if (pending.collectionIds.length) { setCollections(restored); await quoteStorage.setCollections(restored); }
    const pools = rotationPools(next, restored, deliveryCollectionId, additionalQuotes);
    await reconcileQueue(pools.all);
    await resetPlanFrom(dateKey(), pools.all);
    await syncSchedule(pools, notificationTime, additionalQuotes, quoteOrder, soundEnabled);
  }, [clearUndo, collections, deliveryCollectionId, notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  // Recomputed rather than threaded through every call site, so the settings
  // screen can report what the rotation is actually drawing from.
  const pools = rotationPools(quotes, collections, deliveryCollectionId, additionalQuotes);

  const updateNotificationTime = useCallback(async (time: NotificationTime) => {
    await quoteStorage.setNotificationTime(time); setTime(time);
    // Moving the time can move which day the next delivery lands on, so the
    // quote it carries is resolved again rather than reused.
    await syncSchedule(rotationPools(quotes, collections, deliveryCollectionId, additionalQuotes), time, additionalQuotes, quoteOrder, soundEnabled);
  }, [additionalQuotes, collections, deliveryCollectionId, quotes, quoteOrder, soundEnabled, syncSchedule]);

  const updateAdditionalQuotes = useCallback(async (settings: AdditionalQuotesSettings) => {
    await quoteStorage.setAdditionalQuotes(settings); setAdditionalQuotes(settings);
    const next = rotationPools(quotes, collections, deliveryCollectionId, settings);
    // Re-pointing a slot at another collection changes which pool that slot draws
    // from, and the days already planned still hold quotes from the old one, so
    // the committed run is discarded the same way a scope change discards it.
    await resetPlanFrom(dateKey(), next.all);
    await syncSchedule(next, notificationTime, settings, quoteOrder, soundEnabled);
  }, [notificationTime, collections, deliveryCollectionId, quotes, quoteOrder, soundEnabled, syncSchedule]);

  const updateDeliveryCollection = useCallback(async (id: string | null) => {
    await quoteStorage.setDeliveryCollection(id); setDeliveryCollectionId(id);
    const next = rotationPools(quotes, collections, id, additionalQuotes);
    // The cycle is scoped to the pool, so shownIds carried over from the previous
    // scope would mark quotes as already seen that this pool has never delivered
    // — the new collection would start part-way through its first run.
    await resetPlanFrom(dateKey(), next.all);
    await syncSchedule(next, notificationTime, additionalQuotes, quoteOrder, soundEnabled);
  }, [collections, quotes, notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  const updateQuoteOrder = useCallback(async (order: QuoteOrder) => {
    // Only affects which quote is picked next, so nothing needs rescheduling.
    await quoteStorage.setQuoteOrder(order); setQuoteOrder(order);
  }, []);

  const updateSoundEnabled = useCallback(async (enabled: boolean) => {
    await quoteStorage.setSoundEnabled(enabled); setSoundEnabled(enabled);
    // Sound is baked into each pending notification, so the already-scheduled
    // ones must be rebuilt or the toggle does nothing until the next launch.
    await syncSchedule(rotationPools(quotes, collections, deliveryCollectionId, additionalQuotes), notificationTime, additionalQuotes, quoteOrder, enabled);
  }, [notificationTime, additionalQuotes, collections, deliveryCollectionId, quotes, quoteOrder, syncSchedule]);

  const clearAllData = useCallback(async () => {
    // Cancel first: if the wipe fails partway, we would rather have dropped the
    // notifications than leave quotes surfacing from a half-erased bank.
    await cancelAllNotifications();
    await quoteStorage.clearAll();
    // Undoing back into a bank the user just wiped would resurrect exactly what
    // they asked to be rid of.
    clearUndo();
    setQuotes([]); setQuoteOfDay(undefined); setCollections([]);
    setTime(DEFAULT_NOTIFICATION_TIME);
    setAdditionalQuotes(DEFAULT_EXTRA_QUOTES);
    setQuoteOrder(DEFAULT_QUOTE_ORDER); setSoundEnabled(DEFAULT_SOUND_ENABLED);
    // The collection it pointed at is gone with everything else, so leaving the
    // id set would scope delivery to something that no longer exists.
    setDeliveryCollectionId(null);
  }, [clearUndo]);

  const addCollection = useCallback(async (name: string): Promise<Collection> => {
    const col: Collection = { id: uid(), name: name.trim(), quoteIds: [] };
    const next = [...collections, col];
    setCollections(next); await quoteStorage.setCollections(next);
    return col;
  }, [collections]);

  /**
   * Whether the rotation draws from this collection at all — as the daily scope,
   * or as the scope of an extra slot that is currently switched on.
   */
  const drawsFrom = useCallback((collectionId: string): boolean =>
    collectionId === deliveryCollectionId
    || additionalQuotes.collectionIds.slice(0, extraSlotCount(additionalQuotes)).includes(collectionId),
  [deliveryCollectionId, additionalQuotes]);

  const deleteCollection = useCallback(async (id: string) => {
    const next = collections.filter((c) => c.id !== id);
    setCollections(next); await quoteStorage.setCollections(next);
    const wasScoped = drawsFrom(id);
    // Deleting a collection the rotation drew from widens it back to the whole
    // bank. `deliveryPool` already falls back for a missing id, but the stored
    // references are cleared too, so the settings screen does not keep offering a
    // selection that no longer exists — on the daily scope or on any extra slot.
    if (id === deliveryCollectionId) { await quoteStorage.setDeliveryCollection(null); setDeliveryCollectionId(null); }
    let extras = additionalQuotes;
    if (additionalQuotes.collectionIds.includes(id)) {
      extras = { ...additionalQuotes, collectionIds: additionalQuotes.collectionIds.map((c) => c === id ? null : c) };
      await quoteStorage.setAdditionalQuotes(extras); setAdditionalQuotes(extras);
    }
    if (!wasScoped) return;
    const widened = rotationPools(quotes, next, id === deliveryCollectionId ? null : deliveryCollectionId, extras);
    await resetPlanFrom(dateKey(), widened.all);
    await syncSchedule(widened, notificationTime, extras, quoteOrder, soundEnabled);
  }, [collections, deliveryCollectionId, drawsFrom, quotes, notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  /**
   * Re-plans when the edited collection is one the rotation draws from, since
   * adding or removing a quote there changes a pool. Editing any other
   * collection is purely organisational and leaves the schedule alone.
   */
  const resyncIfScoped = useCallback(async (collectionId: string, next: Collection[]) => {
    if (!drawsFrom(collectionId)) return;
    const scoped = rotationPools(quotes, next, deliveryCollectionId, additionalQuotes);
    await reconcileQueue(scoped.all);
    await resetPlanFrom(dateKey(), scoped.all);
    await syncSchedule(scoped, notificationTime, additionalQuotes, quoteOrder, soundEnabled);
  }, [deliveryCollectionId, drawsFrom, quotes, notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  const addQuoteToCollection = useCallback(async (quoteId: string, collectionId: string) => {
    const next = collections.map((c) => c.id === collectionId && !c.quoteIds.includes(quoteId) ? { ...c, quoteIds: [...c.quoteIds, quoteId] } : c);
    setCollections(next); await quoteStorage.setCollections(next);
    await resyncIfScoped(collectionId, next);
  }, [collections, resyncIfScoped]);

  const removeQuoteFromCollection = useCallback(async (quoteId: string, collectionId: string) => {
    const next = collections.map((c) => c.id === collectionId ? { ...c, quoteIds: c.quoteIds.filter((id) => id !== quoteId) } : c);
    setCollections(next); await quoteStorage.setCollections(next);
    await resyncIfScoped(collectionId, next);
  }, [collections, resyncIfScoped]);

  return (
    <QuoteBankContext.Provider value={{ quotes, quoteOfDay, notificationTime, additionalQuotes, collections, loading, saveQuote, updateCustomQuote, removeQuote, lastRemoved, undoRemove, refreshQuoteOfDay, updateNotificationTime, updateAdditionalQuotes, addCollection, deleteCollection, addQuoteToCollection, removeQuoteFromCollection, clearAllData, quoteOrder, updateQuoteOrder, soundEnabled, updateSoundEnabled, deliveryCollectionId, updateDeliveryCollection, deliveryPool: pools.main, extraPools: pools.extras }}>
      {children}
    </QuoteBankContext.Provider>
  );
}

export function useQuoteBank(): QuoteBankContextValue {
  const context = useContext(QuoteBankContext);
  if (!context) throw new Error('useQuoteBank must be used within QuoteBankProvider');
  return context;
}
