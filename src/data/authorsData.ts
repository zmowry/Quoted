import type { Author } from '@/src/types';

export const authorsData: Author[] = [
  { id: 'einstein', name: 'Albert Einstein', bio: 'Physicist known for the theory of relativity.', quotes: [
    { id: 'einstein-1', authorId: 'einstein', text: 'Life is like riding a bicycle. To keep your balance, you must keep moving.' },
    { id: 'einstein-2', authorId: 'einstein', text: 'Imagination is more important than knowledge.' }] },
  { id: 'angelou', name: 'Maya Angelou', bio: 'Poet and civil-rights activist.', quotes: [
    { id: 'angelou-1', authorId: 'angelou', text: 'Nothing will work unless you do.' },
    { id: 'angelou-2', authorId: 'angelou', text: 'Try to be a rainbow in someone’s cloud.' }] },
  { id: 'twain', name: 'Mark Twain', bio: 'American writer and humorist.', quotes: [
    { id: 'twain-1', authorId: 'twain', text: 'The secret of getting ahead is getting started.' },
    { id: 'twain-2', authorId: 'twain', text: 'Kindness is the language which the deaf can hear and the blind can see.' }] },
  { id: 'wilde', name: 'Oscar Wilde', bio: 'Irish playwright known for his wit.', quotes: [
    { id: 'wilde-1', authorId: 'wilde', text: 'Be yourself; everyone else is already taken.' },
    { id: 'wilde-2', authorId: 'wilde', text: 'To live is the rarest thing in the world. Most people exist, that is all.' }] },
  { id: 'keller', name: 'Helen Keller', bio: 'Author and disability-rights advocate.', quotes: [
    { id: 'keller-1', authorId: 'keller', text: 'Alone we can do so little; together we can do so much.' },
    { id: 'keller-2', authorId: 'keller', text: 'Optimism is the faith that leads to achievement.' }] },
  { id: 'austen', name: 'Jane Austen', bio: 'English novelist of manners and romance.', quotes: [
    { id: 'austen-1', authorId: 'austen', text: 'There is no charm equal to tenderness of heart.' },
    { id: 'austen-2', authorId: 'austen', text: 'I declare after all there is no enjoyment like reading.' }] },
  { id: 'baldwin', name: 'James Baldwin', bio: 'Novelist and essayist on race and justice.', quotes: [
    { id: 'baldwin-1', authorId: 'baldwin', text: 'Not everything that is faced can be changed, but nothing can be changed until it is faced.' },
    { id: 'baldwin-2', authorId: 'baldwin', text: 'The world changes according to the way people see it.' }] },
  { id: 'elegant', name: 'George Eliot', bio: 'English novelist of moral depth.', quotes: [
    { id: 'eliot-1', authorId: 'elegant', text: 'It is never too late to be what you might have been.' },
    { id: 'eliot-2', authorId: 'elegant', text: 'What do we live for, if it is not to make life less difficult for each other?' }] },
  { id: 'emerson', name: 'Ralph Waldo Emerson', bio: 'Essayist and transcendentalist philosopher.', quotes: [
    { id: 'emerson-1', authorId: 'emerson', text: 'Nothing great was ever achieved without enthusiasm.' },
    { id: 'emerson-2', authorId: 'emerson', text: 'To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.' }] },
  { id: 'gibran', name: 'Kahlil Gibran', bio: 'Poet and artist known for lyrical wisdom.', quotes: [
    { id: 'gibran-1', authorId: 'gibran', text: 'Tenderness and kindness are not signs of weakness and despair, but manifestations of strength and resolution.' },
    { id: 'gibran-2', authorId: 'gibran', text: 'Out of suffering have emerged the strongest souls.' }] },
  { id: 'king', name: 'Martin Luther King Jr.', bio: 'Civil-rights leader and minister.', quotes: [
    { id: 'king-1', authorId: 'king', text: 'Darkness cannot drive out darkness; only light can do that.' },
    { id: 'king-2', authorId: 'king', text: 'The time is always right to do what is right.' }] },
  { id: 'lao-tzu', name: 'Lao Tzu', bio: 'Ancient philosopher, author of the Tao Te Ching.', quotes: [
    { id: 'lao-tzu-1', authorId: 'lao-tzu', text: 'A journey of a thousand miles begins with a single step.' },
    { id: 'lao-tzu-2', authorId: 'lao-tzu', text: 'When I let go of what I am, I become what I might be.' }] },
  { id: 'lord', name: 'Audre Lorde', bio: 'Poet and activist for identity and justice.', quotes: [
    { id: 'lorde-1', authorId: 'lord', text: 'Caring for myself is not self-indulgence, it is self-preservation.' },
    { id: 'lorde-2', authorId: 'lord', text: 'When I use my strength in the service of my vision, it becomes less and less important whether I am afraid.' }] },
  { id: 'marcus-aurelius', name: 'Marcus Aurelius', bio: 'Roman emperor and Stoic philosopher.', quotes: [
    { id: 'marcus-aurelius-1', authorId: 'marcus-aurelius', text: 'The happiness of your life depends upon the quality of your thoughts.' },
    { id: 'marcus-aurelius-2', authorId: 'marcus-aurelius', text: 'You have power over your mind—not outside events.' }] },
  { id: 'roosevelt', name: 'Eleanor Roosevelt', bio: 'Diplomat and human-rights champion.', quotes: [
    { id: 'roosevelt-1', authorId: 'roosevelt', text: 'The future belongs to those who believe in the beauty of their dreams.' },
    { id: 'roosevelt-2', authorId: 'roosevelt', text: 'No one can make you feel inferior without your consent.' }] },
  { id: 'rumi', name: 'Rumi', bio: 'Persian poet and mystic.', quotes: [
    { id: 'rumi-1', authorId: 'rumi', text: 'The wound is the place where the light enters you.' },
    { id: 'rumi-2', authorId: 'rumi', text: 'What you seek is seeking you.' }] },
  { id: 'seneca', name: 'Seneca', bio: 'Roman Stoic philosopher and statesman.', quotes: [
    { id: 'seneca-1', authorId: 'seneca', text: 'Luck is what happens when preparation meets opportunity.' },
    { id: 'seneca-2', authorId: 'seneca', text: 'We suffer more often in imagination than in reality.' }] },
  { id: 'shakespeare', name: 'William Shakespeare', bio: 'English playwright and poet.', quotes: [
    { id: 'shakespeare-1', authorId: 'shakespeare', text: 'This above all: to thine own self be true.' },
    { id: 'shakespeare-2', authorId: 'shakespeare', text: 'The better part of valour is discretion.' }] },
  { id: 'thoreau', name: 'Henry David Thoreau', bio: 'Writer and naturalist, author of Walden.', quotes: [
    { id: 'thoreau-1', authorId: 'thoreau', text: 'Go confidently in the direction of your dreams. Live the life you have imagined.' },
    { id: 'thoreau-2', authorId: 'thoreau', text: 'It is not enough to be busy. So are the ants. The question is: what are we busy about?' }] },
  { id: 'woolf', name: 'Virginia Woolf', bio: 'English modernist novelist and essayist.', quotes: [
    { id: 'woolf-1', authorId: 'woolf', text: 'No need to hurry. No need to sparkle. No need to be anybody but oneself.' },
    { id: 'woolf-2', authorId: 'woolf', text: 'Arrange whatever pieces come your way.' }] }
];

export const authorById = (id: string): Author | undefined => authorsData.find((author) => author.id === id);