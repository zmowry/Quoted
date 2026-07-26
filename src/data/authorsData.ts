import type { Author } from '@/src/types';

export const authorsData: Author[] = [
  { id: 'einstein', name: 'Albert Einstein', bio: 'Theoretical physicist known for relativity and a lifelong curiosity about the universe.', quotes: [
    { id: 'einstein-1', authorId: 'einstein', text: 'Life is like riding a bicycle. To keep your balance, you must keep moving.' },
    { id: 'einstein-2', authorId: 'einstein', text: 'Imagination is more important than knowledge.' }] },
  { id: 'angelou', name: 'Maya Angelou', bio: 'American poet, memoirist, and civil rights activist whose work celebrated resilience.', quotes: [
    { id: 'angelou-1', authorId: 'angelou', text: 'Nothing will work unless you do.' },
    { id: 'angelou-2', authorId: 'angelou', text: 'Try to be a rainbow in someone’s cloud.' }] },
  { id: 'twain', name: 'Mark Twain', bio: 'American writer and humorist, widely regarded as one of the country’s great storytellers.', quotes: [
    { id: 'twain-1', authorId: 'twain', text: 'The secret of getting ahead is getting started.' },
    { id: 'twain-2', authorId: 'twain', text: 'Kindness is the language which the deaf can hear and the blind can see.' }] },
  { id: 'wilde', name: 'Oscar Wilde', bio: 'Irish playwright, novelist, and poet renowned for his wit and style.', quotes: [
    { id: 'wilde-1', authorId: 'wilde', text: 'Be yourself; everyone else is already taken.' },
    { id: 'wilde-2', authorId: 'wilde', text: 'To live is the rarest thing in the world. Most people exist, that is all.' }] },
  { id: 'keller', name: 'Helen Keller', bio: 'American author and disability-rights advocate who transformed adversity into advocacy.', quotes: [
    { id: 'keller-1', authorId: 'keller', text: 'Alone we can do so little; together we can do so much.' },
    { id: 'keller-2', authorId: 'keller', text: 'Optimism is the faith that leads to achievement.' }] }
];

export const authorById = (id: string): Author | undefined => authorsData.find((author) => author.id === id);
