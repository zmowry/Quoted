import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren, ReactElement } from 'react';
import type { AdditionalQuotesSettings, Collection, NotificationTime, Quote, QuoteBankContextValue } from '@/src/types';
import { DEFAULT_EXTRA_QUOTES, DEFAULT_NOTIFICATION_TIME, quoteStorage } from '@/src/services/storage';
import { nextQuoteInCycle, reconcileQueue } from '@/src/services/queueManager';
import { cancelAllNotifications, scheduleAllNotifications } from '@/src/services/notifications';

const QuoteBankContext = createContext<QuoteBankContextValue | undefined>(undefined);

const uid = () => Math.random().toString(36).slice(2);

export function QuoteBankProvider({ children }: PropsWithChildren): ReactElement {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteOfDay, setQuoteOfDay] = useState<Quote>();
  const [notificationTime, setTime] = useState<NotificationTime>(DEFAULT_NOTIFICATION_TIME);
  const [additionalQuotes, setAdditionalQuotes] = useState<AdditionalQuotesSettings>(DEFAULT_EXTRA_QUOTES);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshQuoteOfDay = useCallback(async () => {
    const latest = await quoteStorage.getQuotes();
    const next = await nextQuoteInCycle(latest);
    setQuoteOfDay(next);
    await scheduleAllNotifications(notificationTime, next, additionalQuotes, latest);
  }, [notificationTime, additionalQuotes]);

  useEffect(() => { void (async () => {
    try {
      const [storedQuotes, storedTime, storedExtra, storedCollections] = await Promise.all([
        quoteStorage.getQuotes(), quoteStorage.getNotificationTime(),
        quoteStorage.getAdditionalQuotes(), quoteStorage.getCollections(),
      ]);
      setQuotes(storedQuotes); setTime(storedTime); setAdditionalQuotes(storedExtra); setCollections(storedCollections);
      const next = await nextQuoteInCycle(storedQuotes);
      setQuoteOfDay(next);
      await scheduleAllNotifications(storedTime, next, storedExtra, storedQuotes, { skipIfAlreadyScheduled: true });
    } finally { setLoading(false); }
  })(); }, []);

  const saveQuote = useCallback(async (quote: Quote) => {
    const next = await quoteStorage.saveQuote(quote);
    setQuotes(next); await reconcileQueue(next);
    // Seed the banner if this is the first quote, but leave notifications alone.
    // They will pick up the new quote on the next scheduled refresh.
    if (!quoteOfDay) {
      const first = await nextQuoteInCycle(next);
      setQuoteOfDay(first);
    }
  }, [quoteOfDay]);

  const removeQuote = useCallback(async (id: string) => {
    const next = await quoteStorage.deleteQuote(id);
    setQuotes(next); await reconcileQueue(next);
    const keptCurrent = next.some((q) => q.id === quoteOfDay?.id);
    const current = keptCurrent ? quoteOfDay : await nextQuoteInCycle(next);
    setQuoteOfDay(current);
    // Saving can wait for the next refresh, but a delete cannot: the pending
    // notification still carries the deleted quote's text and would keep firing
    // it. Re-point the schedule at the replacement (or the empty-bank fallback).
    if (!keptCurrent) await scheduleAllNotifications(notificationTime, current, additionalQuotes, next);
    // remove from all collections
    const updated = collections.map((c) => ({ ...c, quoteIds: c.quoteIds.filter((qid) => qid !== id) }));
    setCollections(updated); await quoteStorage.setCollections(updated);
  }, [quoteOfDay, collections, notificationTime, additionalQuotes]);

  const updateNotificationTime = useCallback(async (time: NotificationTime) => {
    await quoteStorage.setNotificationTime(time); setTime(time);
    await scheduleAllNotifications(time, quoteOfDay, additionalQuotes, quotes);
  }, [quoteOfDay, additionalQuotes, quotes]);

  const updateAdditionalQuotes = useCallback(async (settings: AdditionalQuotesSettings) => {
    await quoteStorage.setAdditionalQuotes(settings); setAdditionalQuotes(settings);
    await scheduleAllNotifications(notificationTime, quoteOfDay, settings, quotes);
  }, [notificationTime, quoteOfDay, quotes]);

  const clearAllData = useCallback(async () => {
    // Cancel first: if the wipe fails partway, we would rather have dropped the
    // notifications than leave quotes surfacing from a half-erased bank.
    await cancelAllNotifications();
    await quoteStorage.clearAll();
    setQuotes([]); setQuoteOfDay(undefined); setCollections([]);
    setTime({ hour: 9, minute: 0 });
    setAdditionalQuotes(DEFAULT_EXTRA_QUOTES);
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
    <QuoteBankContext.Provider value={{ quotes, quoteOfDay, notificationTime, additionalQuotes, collections, loading, saveQuote, removeQuote, refreshQuoteOfDay, updateNotificationTime, updateAdditionalQuotes, addCollection, deleteCollection, addQuoteToCollection, removeQuoteFromCollection, clearAllData }}>
      {children}
    </QuoteBankContext.Provider>
  );
}

export function useQuoteBank(): QuoteBankContextValue {
  const context = useContext(QuoteBankContext);
  if (!context) throw new Error('useQuoteBank must be used within QuoteBankProvider');
  return context;
}
