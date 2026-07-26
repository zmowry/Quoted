import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { NotificationTime, Quote, QuoteBankContextValue } from '@/src/types';
import { quoteStorage } from '@/src/services/storage';
import { nextQuoteInCycle, reconcileQueue } from '@/src/services/queueManager';
import { scheduleDailyNotification } from '@/src/services/notifications';

const QuoteBankContext = createContext<QuoteBankContextValue | undefined>(undefined);

export function QuoteBankProvider({ children }: PropsWithChildren): JSX.Element {
  const [quotes, setQuotes] = useState<Quote[]>([]); const [quoteOfDay, setQuoteOfDay] = useState<Quote>(); const [notificationTime, setTime] = useState<NotificationTime>({ hour: 9, minute: 0 }); const [loading, setLoading] = useState(true);
  const refreshQuoteOfDay = useCallback(async () => { const latest = await quoteStorage.getQuotes(); const next = await nextQuoteInCycle(latest); setQuoteOfDay(next); await scheduleDailyNotification(notificationTime, next); }, [notificationTime]);
  useEffect(() => { void (async () => {
    try {
      const [storedQuotes, storedTime] = await Promise.all([quoteStorage.getQuotes(), quoteStorage.getNotificationTime()]);
      setQuotes(storedQuotes); setTime(storedTime);
      const next = await nextQuoteInCycle(storedQuotes);
      setQuoteOfDay(next);
      await scheduleDailyNotification(storedTime, next);
    } finally {
      // Rendering the bank must not depend on storage/notification availability.
      setLoading(false);
    }
  })(); }, []);
  const saveQuote = useCallback(async (quote: Quote) => { const next = await quoteStorage.saveQuote(quote); setQuotes(next); await reconcileQueue(next); if (!quoteOfDay) await refreshQuoteOfDay(); else await scheduleDailyNotification(notificationTime, quoteOfDay); }, [notificationTime, quoteOfDay, refreshQuoteOfDay]);
  const removeQuote = useCallback(async (id: string) => { const next = await quoteStorage.deleteQuote(id); setQuotes(next); await reconcileQueue(next); const current = next.some((quote) => quote.id === quoteOfDay?.id) ? quoteOfDay : await nextQuoteInCycle(next); setQuoteOfDay(current); await scheduleDailyNotification(notificationTime, current); }, [notificationTime, quoteOfDay]);
  const updateNotificationTime = useCallback(async (time: NotificationTime) => { await quoteStorage.setNotificationTime(time); setTime(time); await scheduleDailyNotification(time, quoteOfDay); }, [quoteOfDay]);
  return <QuoteBankContext.Provider value={{ quotes, quoteOfDay, notificationTime, loading, saveQuote, removeQuote, refreshQuoteOfDay, updateNotificationTime }}>{children}</QuoteBankContext.Provider>;
}
export function useQuoteBank(): QuoteBankContextValue { const context = useContext(QuoteBankContext); if (!context) throw new Error('useQuoteBank must be used within QuoteBankProvider'); return context; }
