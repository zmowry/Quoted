export interface Quote { id: string; text: string; authorId: string; authorName: string; }
export interface Author { id: string; name: string; bio: string; quotes: Omit<Quote, 'authorName'>[]; }
export interface QueueState { shownIds: string[]; }
export interface NotificationTime { hour: number; minute: number; }
export interface AdditionalQuotesSettings { enabled: boolean; count: number; times: NotificationTime[]; }
export interface Collection { id: string; name: string; quoteIds: string[]; }
export interface QuoteBankContextValue { quotes: Quote[]; quoteOfDay?: Quote; notificationTime: NotificationTime; additionalQuotes: AdditionalQuotesSettings; collections: Collection[]; loading: boolean; saveQuote: (quote: Quote) => Promise<void>; removeQuote: (id: string) => Promise<void>; refreshQuoteOfDay: () => Promise<void>; updateNotificationTime: (time: NotificationTime) => Promise<void>; updateAdditionalQuotes: (settings: AdditionalQuotesSettings) => Promise<void>; addCollection: (name: string) => Promise<Collection>; deleteCollection: (id: string) => Promise<void>; addQuoteToCollection: (quoteId: string, collectionId: string) => Promise<void>; removeQuoteFromCollection: (quoteId: string, collectionId: string) => Promise<void>; }
export interface Author { id: string; name: string; bio: string; photoUrl?: string; quotes: Omit<Quote, 'authorName'>[]; }