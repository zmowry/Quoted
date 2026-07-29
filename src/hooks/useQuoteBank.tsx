import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren, ReactElement } from 'react';
import { AppState } from 'react-native';
import type { AdditionalQuotesSettings, Collection, NotificationTime, Quote, QuoteBankContextValue, QuoteOrder } from '@/src/types';
import { DEFAULT_EXTRA_QUOTES, DEFAULT_NOTIFICATION_TIME, DEFAULT_QUOTE_ORDER, DEFAULT_SOUND_ENABLED, quoteStorage } from '@/src/services/storage';
import { dateKey, planRotation, reassignDate, reconcileQueue, resetPlanFrom } from '@/src/services/queueManager';
import { cancelAllNotifications, scheduleAllNotifications } from '@/src/services/notifications';

const QuoteBankContext = createContext<QuoteBankContextValue | undefined>(undefined);

/**
 * How far ahead the rotation is written out. Every launch tops this back up, so
 * it only has to cover the gap until the user next opens the app; the notifi-
 * cation budget in `scheduleAllNotifications` trims it further when extra
 * quotes per day are switched on.
 */
const SCHEDULE_HORIZON_DAYS = 14;

const uid = () => Math.random().toString(36).slice(2);

export function QuoteBankProvider({ children }: PropsWithChildren): ReactElement {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteOfDay, setQuoteOfDay] = useState<Quote>();
  const [notificationTime, setTime] = useState<NotificationTime>(DEFAULT_NOTIFICATION_TIME);
  const [additionalQuotes, setAdditionalQuotes] = useState<AdditionalQuotesSettings>(DEFAULT_EXTRA_QUOTES);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [quoteOrder, setQuoteOrder] = useState<QuoteOrder>(DEFAULT_QUOTE_ORDER);
  const [soundEnabled, setSoundEnabled] = useState(DEFAULT_SOUND_ENABLED);
  const [loading, setLoading] = useState(true);

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
    latest: Quote[], time: NotificationTime, extras: AdditionalQuotesSettings, order: QuoteOrder, sound: boolean,
  ): Promise<void> => {
    const run = async (): Promise<void> => {
      // An empty bank gets a short nudge rather than a fortnight of identical
      // ones — but it needs more than today, whose delivery time may already
      // have passed, leaving nothing scheduled at all.
      const plan = await planRotation(latest, order, {
        days: latest.length ? SCHEDULE_HORIZON_DAYS : 2,
        extras: extras.enabled ? Math.min(extras.count, extras.times.length) : 0,
      });
      setQuoteOfDay(plan[0]?.quote);
      syncedFor.current = dateKey();
      await scheduleAllNotifications(time, plan, extras, { sound });
    };
    pending.current = pending.current.then(run, run);
    return pending.current;
  }, []);

  const refreshQuoteOfDay = useCallback(async () => {
    const latest = await quoteStorage.getQuotes();
    // An explicit refresh is the one case that should burn a quote. Replacing
    // today's also invalidates the days planned behind it, which would otherwise
    // be free to repeat the quote just drawn.
    await reassignDate(dateKey(), latest, quoteOrder);
    await resetPlanFrom(dateKey(), latest);
    await syncSchedule(latest, notificationTime, additionalQuotes, quoteOrder, soundEnabled);
  }, [notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  useEffect(() => { void (async () => {
    try {
      const [storedQuotes, storedTime, storedExtra, storedCollections, storedOrder, storedSound] = await Promise.all([
        quoteStorage.getQuotes(), quoteStorage.getNotificationTime(),
        quoteStorage.getAdditionalQuotes(), quoteStorage.getCollections(),
        quoteStorage.getQuoteOrder(), quoteStorage.getSoundEnabled(),
      ]);
      setQuotes(storedQuotes); setTime(storedTime); setAdditionalQuotes(storedExtra); setCollections(storedCollections);
      setQuoteOrder(storedOrder); setSoundEnabled(storedSound);
      // Tops the horizon back up: days that have already been delivered are
      // spent, so every launch extends the run back out to its full length.
      await syncSchedule(storedQuotes, storedTime, storedExtra, storedOrder, storedSound);
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
        await syncSchedule(latest, notificationTime, additionalQuotes, quoteOrder, soundEnabled);
      })();
    });
    return () => sub.remove();
  }, [loading, notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  const saveQuote = useCallback(async (quote: Quote) => {
    const next = await quoteStorage.saveQuote(quote);
    setQuotes(next); await reconcileQueue(next);
    // The rotation is already written out for the next fortnight, so without
    // discarding that plan a newly saved quote would not surface until it ran out.
    await resetPlanFrom(dateKey(), next);
    await syncSchedule(next, notificationTime, additionalQuotes, quoteOrder, soundEnabled);
  }, [notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  const removeQuote = useCallback(async (id: string) => {
    const next = await quoteStorage.deleteQuote(id);
    setQuotes(next); await reconcileQueue(next);
    // Every planned day still carries the deleted quote's text in the OS, so the
    // whole run is discarded and re-drawn from what is left.
    await resetPlanFrom(dateKey(), next);
    await syncSchedule(next, notificationTime, additionalQuotes, quoteOrder, soundEnabled);
    // remove from all collections
    const updated = collections.map((c) => ({ ...c, quoteIds: c.quoteIds.filter((qid) => qid !== id) }));
    setCollections(updated); await quoteStorage.setCollections(updated);
  }, [collections, notificationTime, additionalQuotes, quoteOrder, soundEnabled, syncSchedule]);

  const updateNotificationTime = useCallback(async (time: NotificationTime) => {
    await quoteStorage.setNotificationTime(time); setTime(time);
    // Moving the time can move which day the next delivery lands on, so the
    // quote it carries is resolved again rather than reused.
    await syncSchedule(quotes, time, additionalQuotes, quoteOrder, soundEnabled);
  }, [additionalQuotes, quotes, quoteOrder, soundEnabled, syncSchedule]);

  const updateAdditionalQuotes = useCallback(async (settings: AdditionalQuotesSettings) => {
    await quoteStorage.setAdditionalQuotes(settings); setAdditionalQuotes(settings);
    await syncSchedule(quotes, notificationTime, settings, quoteOrder, soundEnabled);
  }, [notificationTime, quotes, quoteOrder, soundEnabled, syncSchedule]);

  const updateQuoteOrder = useCallback(async (order: QuoteOrder) => {
    // Only affects which quote is picked next, so nothing needs rescheduling.
    await quoteStorage.setQuoteOrder(order); setQuoteOrder(order);
  }, []);

  const updateSoundEnabled = useCallback(async (enabled: boolean) => {
    await quoteStorage.setSoundEnabled(enabled); setSoundEnabled(enabled);
    // Sound is baked into each pending notification, so the already-scheduled
    // ones must be rebuilt or the toggle does nothing until the next launch.
    await syncSchedule(quotes, notificationTime, additionalQuotes, quoteOrder, enabled);
  }, [notificationTime, additionalQuotes, quotes, quoteOrder, syncSchedule]);

  const clearAllData = useCallback(async () => {
    // Cancel first: if the wipe fails partway, we would rather have dropped the
    // notifications than leave quotes surfacing from a half-erased bank.
    await cancelAllNotifications();
    await quoteStorage.clearAll();
    setQuotes([]); setQuoteOfDay(undefined); setCollections([]);
    setTime(DEFAULT_NOTIFICATION_TIME);
    setAdditionalQuotes(DEFAULT_EXTRA_QUOTES);
    setQuoteOrder(DEFAULT_QUOTE_ORDER); setSoundEnabled(DEFAULT_SOUND_ENABLED);
  }, []);

  const addCollection = useCallback(async (name: string): Promise<Collection> => {
    const col: Collection = { id: uid(), name: name.trim(), quoteIds: [] };
    const next = [...collections, col];
    setCollections(next); await quoteStorage.setCollections(next);
    return col;
  }, [collections]);

  const deleteCollection = useCallback(async (id: string) => {
    const next = collections.filter((c) => c.id !== id);
    setCollections(next); await quoteStorage.setCollections(next);
  }, [collections]);

  const addQuoteToCollection = useCallback(async (quoteId: string, collectionId: string) => {
    const next = collections.map((c) => c.id === collectionId && !c.quoteIds.includes(quoteId) ? { ...c, quoteIds: [...c.quoteIds, quoteId] } : c);
    setCollections(next); await quoteStorage.setCollections(next);
  }, [collections]);

  const removeQuoteFromCollection = useCallback(async (quoteId: string, collectionId: string) => {
    const next = collections.map((c) => c.id === collectionId ? { ...c, quoteIds: c.quoteIds.filter((id) => id !== quoteId) } : c);
    setCollections(next); await quoteStorage.setCollections(next);
  }, [collections]);

  return (
    <QuoteBankContext.Provider value={{ quotes, quoteOfDay, notificationTime, additionalQuotes, collections, loading, saveQuote, removeQuote, refreshQuoteOfDay, updateNotificationTime, updateAdditionalQuotes, addCollection, deleteCollection, addQuoteToCollection, removeQuoteFromCollection, clearAllData, quoteOrder, updateQuoteOrder, soundEnabled, updateSoundEnabled }}>
      {children}
    </QuoteBankContext.Provider>
  );
}

export function useQuoteBank(): QuoteBankContextValue {
  const context = useContext(QuoteBankContext);
  if (!context) throw new Error('useQuoteBank must be used within QuoteBankProvider');
  return context;
}
