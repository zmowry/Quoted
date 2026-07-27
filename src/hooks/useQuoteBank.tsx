import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { AdditionalQuotesSettings, Collection, NotificationTime, Quote, QuoteBankContextValue } from '@/src/types';
import { quoteStorage } from '@/src/services/storage';
import { nextQuoteInCycle, reconcileQueue } from '@/src/services/queueManager';
import { scheduleAllNotifications } from '@/src/services/notifications';

const QuoteBankContext = createContext<QuoteBankContextValue | undefined>(undefined);

const uid = () => Math.random().toString(36).slice(2);

export function QuoteBankProvider({ children }: PropsWithChildren): JSX.Element {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteOfDay, setQuoteOfDay] = useState<Quote>();
  const [notificationTime, setTime] = useState<NotificationTime>({ hour: 9, minute: 0 });
  const [additionalQuotes, setAdditionalQuotes] = useState<AdditionalQuotesSettings>({ enabled: false, count: 2, times: [{ hour: 12, minute: 0 }, { hour: 20, minute: 0 }, { hour: 6, minute: 0 }, { hour: 15, minute: 0 }, { hour: 18, minute: 0 }] });
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
      await scheduleAllNotifications(storedTime, next, storedExtra, storedQuotes);
    } finally { setLoading(false); }
  })(); }, []);

  const saveQuote = useCallback(async (quote: Quote) => {
    const next = await quoteStorage.saveQuote(quote);
    setQuotes(next); await reconcileQueue(next);
    if (!quoteOfDay) await refreshQuoteOfDay();
    else await scheduleAllNotifications(notificationTime, quoteOfDay, additionalQuotes, next);
  }, [notificationTime, quoteOfDay, additionalQuotes, refreshQuoteOfDay]);

  const removeQuote = useCallback(async (id: string) => {
    const next = await quoteStorage.deleteQuote(id);
    setQuotes(next); await reconcileQueue(next);
    const current = next.some((q) => q.id === quoteOfDay?.id) ? quoteOfDay : await nextQuoteInCycle(next);
    setQuoteOfDay(current);
    await scheduleAllNotifications(notificationTime, current, additionalQuotes, next);
    // remove from all collections
    const updated = collections.map((c) => ({ ...c, quoteIds: c.quoteIds.filter((qid) => qid !== id) }));
    setCollections(updated); await quoteStorage.setCollections(updated);
  }, [notificationTime, quoteOfDay, additionalQuotes, collections]);

  const updateNotificationTime = useCallback(async (time: NotificationTime) => {
    await quoteStorage.setNotificationTime(time); setTime(time);
    await scheduleAllNotifications(time, quoteOfDay, additionalQuotes, quotes);
  }, [quoteOfDay, additionalQuotes, quotes]);

  const updateAdditionalQuotes = useCallback(async (settings: AdditionalQuotesSettings) => {
    await quoteStorage.setAdditionalQuotes(settings); setAdditionalQuotes(settings);
    await scheduleAllNotifications(notificationTime, quoteOfDay, settings, quotes);
  }, [notificationTime, quoteOfDay, quotes]);

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
    <QuoteBankContext.Provider value={{ quotes, quoteOfDay, notificationTime, additionalQuotes, collections, loading, saveQuote, removeQuote, refreshQuoteOfDay, updateNotificationTime, updateAdditionalQuotes, addCollection, deleteCollection, addQuoteToCollection, removeQuoteFromCollection }}>
      {children}
    </QuoteBankContext.Provider>
  );
}

export function useQuoteBank(): QuoteBankContextValue {
  const context = useContext(QuoteBankContext);
  if (!context) throw new Error('useQuoteBank must be used within QuoteBankProvider');
  return context;
}
