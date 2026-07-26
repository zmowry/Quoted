export interface Quote { id: string; text: string; authorId: string; authorName: string; }
export interface Author { id: string; name: string; bio: string; quotes: Omit<Quote, 'authorName'>[]; }
export interface QueueState { shownIds: string[]; }
export interface NotificationTime { hour: number; minute: number; }
export interface QuoteBankContextValue { quotes: Quote[]; quoteOfDay?: Quote; notificationTime: NotificationTime; loading: boolean; saveQuote: (quote: Quote) => Promise<void>; removeQuote: (id: string) => Promise<void>; refreshQuoteOfDay: () => Promise<void>; updateNotificationTime: (time: NotificationTime) => Promise<void>; }
export interface Author { id: string; name: string; bio: string; photoUrl?: string; quotes: Omit<Quote, 'authorName'>[]; }