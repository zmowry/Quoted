export interface Quote { id: string; text: string; authorId: string; authorName: string; }
export interface Author { id: string; name: string; bio: string; quotes: Omit<Quote, 'authorName'>[]; }
export interface QueueState { shownIds: string[]; }
/**
 * Which quote belongs to which calendar day, keyed `YYYY-MM-DD` in local time.
 *
 * Without this the cycle advances on every app launch, so re-opening the app
 * burns through quotes and leaves the banner disagreeing with the notification
 * that is already pending in the OS.
 */
export type DailyAssignments = Record<string, string>;
/**
 * One day of the rotation: the calendar day, the quote its daily notification
 * delivers, and the quotes for any extra notifications that day. Every slot is
 * drawn from the same cycle, so the no-repeat guarantee covers all of them.
 */
export interface PlannedDay { day: Date; quote?: Quote; extras: Quote[]; }
export interface NotificationTime { hour: number; minute: number; }
export interface AdditionalQuotesSettings { enabled: boolean; count: number; times: NotificationTime[]; }
export interface Collection { id: string; name: string; quoteIds: string[]; }
/** How the daily rotation picks the next quote from the unseen pool. */
export type QuoteOrder = 'sequential' | 'shuffle';
export interface QuoteBankContextValue { quotes: Quote[]; quoteOfDay?: Quote; notificationTime: NotificationTime; additionalQuotes: AdditionalQuotesSettings; collections: Collection[]; loading: boolean; saveQuote: (quote: Quote) => Promise<void>; updateCustomQuote: (quote: Quote) => Promise<void>; removeQuote: (id: string) => Promise<void>; lastRemoved?: Quote; undoRemove: () => Promise<void>; refreshQuoteOfDay: () => Promise<void>; updateNotificationTime: (time: NotificationTime) => Promise<void>; updateAdditionalQuotes: (settings: AdditionalQuotesSettings) => Promise<void>; addCollection: (name: string) => Promise<Collection>; deleteCollection: (id: string) => Promise<void>; addQuoteToCollection: (quoteId: string, collectionId: string) => Promise<void>; removeQuoteFromCollection: (quoteId: string, collectionId: string) => Promise<void>; clearAllData: () => Promise<void>; quoteOrder: QuoteOrder; updateQuoteOrder: (order: QuoteOrder) => Promise<void>; soundEnabled: boolean; updateSoundEnabled: (enabled: boolean) => Promise<void>; }
export interface Author { id: string; name: string; bio: string; photoUrl?: string; quotes: Omit<Quote, 'authorName'>[]; }