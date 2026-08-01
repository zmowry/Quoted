import { THEMES } from '@/src/data/themes';
import type { ThemeId } from '@/src/data/themes';
import type { Author, Quote } from '@/src/types';

export const authorsData: Author[] = [
  { id: 'einstein', name: 'Albert Einstein', bio: 'Physicist known for the theory of relativity.', themes: ['creativity', 'wisdom', 'change', 'simplicity', 'humor', 'truth'], quotes: [
    { id: 'einstein-1', authorId: 'einstein', text: 'Life is like riding a bicycle. To keep your balance, you must keep moving.' },
    { id: 'einstein-2', authorId: 'einstein', text: 'Imagination is more important than knowledge.' },
    { id: 'einstein-3', authorId: 'einstein', text: 'A person who never made a mistake never tried anything new.' },
    { id: 'einstein-4', authorId: 'einstein', text: 'In the middle of difficulty lies opportunity.' },
    { id: 'einstein-5', authorId: 'einstein', text: 'Try not to become a man of success, but rather try to become a man of value.' },
    { id: 'einstein-6', authorId: 'einstein', text: 'The important thing is not to stop questioning. Curiosity has its own reason for existing.' },
    { id: 'einstein-7', authorId: 'einstein', text: 'Two things are infinite: the universe and human stupidity; and I\'m not sure about the universe.' },
    { id: 'einstein-8', authorId: 'einstein', text: 'Logic will get you from A to B. Imagination will take you everywhere.' },
    { id: 'einstein-9', authorId: 'einstein', text: 'If you can\'t explain it simply, you don\'t understand it well enough.' },
    { id: 'einstein-10', authorId: 'einstein', text: 'The measure of intelligence is the ability to change.' },
    { id: 'einstein-11', authorId: 'einstein', text: 'Few are those who see with their own eyes and feel with their own hearts.' },
    { id: 'einstein-12', authorId: 'einstein', text: 'A quiet and modest life brings more joy than a pursuit of success bound with constant unrest.' }] },

  { id: 'angelou', name: 'Maya Angelou', bio: 'Poet and civil-rights activist.', themes: ['courage', 'resilience', 'love', 'justice', 'self-knowledge', 'hope'], quotes: [
    { id: 'angelou-1', authorId: 'angelou', text: 'Nothing will work unless you do.' },
    { id: 'angelou-2', authorId: 'angelou', text: 'Try to be a rainbow in someone\'s cloud.' },
    { id: 'angelou-3', authorId: 'angelou', text: 'I\'ve learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.' },
    { id: 'angelou-4', authorId: 'angelou', text: 'You may not control all the events that happen to you, but you can decide not to be reduced by them.' },
    { id: 'angelou-5', authorId: 'angelou', text: 'If you don\'t like something, change it. If you can\'t change it, change your attitude.' },
    { id: 'angelou-6', authorId: 'angelou', text: 'There is no greater agony than bearing an untold story inside you.' },
    { id: 'angelou-7', authorId: 'angelou', text: 'We delight in the beauty of the butterfly, but rarely admit the changes it has gone through to achieve that beauty.' },
    { id: 'angelou-8', authorId: 'angelou', text: 'I\'ve learned that making a living is not the same thing as making a life.' },
    { id: 'angelou-9', authorId: 'angelou', text: 'You alone are enough. You have nothing to prove to anybody.' },
    { id: 'angelou-10', authorId: 'angelou', text: 'The ache for home lives in all of us, the safe place where we can go as we are and not be questioned.' },
    { id: 'angelou-11', authorId: 'angelou', text: 'My mission in life is not merely to survive, but to thrive; and to do so with some passion, some compassion, some humor, and some style.' },
    { id: 'angelou-12', authorId: 'angelou', text: 'If you find it in your heart to care for somebody else, you will have succeeded.' }] },

  { id: 'twain', name: 'Mark Twain', bio: 'American writer and humorist.', themes: ['humor', 'wisdom', 'courage', 'truth', 'change'], quotes: [
    { id: 'twain-1', authorId: 'twain', text: 'The secret of getting ahead is getting started.' },
    { id: 'twain-2', authorId: 'twain', text: 'Kindness is the language which the deaf can hear and the blind can see.' },
    { id: 'twain-3', authorId: 'twain', text: 'The two most important days in your life are the day you are born and the day you find out why.' },
    { id: 'twain-4', authorId: 'twain', text: 'It ain\'t what you don\'t know that gets you into trouble. It\'s what you know for sure that just ain\'t so.' },
    { id: 'twain-5', authorId: 'twain', text: 'Courage is resistance to fear, mastery of fear — not absence of fear.' },
    { id: 'twain-6', authorId: 'twain', text: 'Whenever you find yourself on the side of the majority, it is time to pause and reflect.' },
    { id: 'twain-7', authorId: 'twain', text: 'If you tell the truth, you don\'t have to remember anything.' },
    { id: 'twain-8', authorId: 'twain', text: 'Travel is fatal to prejudice, bigotry, and narrow-mindedness.' },
    { id: 'twain-9', authorId: 'twain', text: 'The man who does not read has no advantage over the man who cannot read.' },
    { id: 'twain-10', authorId: 'twain', text: 'Keep away from people who try to belittle your ambitions.' },
    { id: 'twain-11', authorId: 'twain', text: 'Good friends, good books, and a sleepy conscience: this is the ideal life.' },
    { id: 'twain-12', authorId: 'twain', text: 'The fear of death follows from the fear of life. A man who lives fully is prepared to die at any time.' }] },

  { id: 'wilde', name: 'Oscar Wilde', bio: 'Irish playwright known for his wit.', themes: ['humor', 'self-knowledge', 'love', 'creativity', 'truth'], quotes: [
    { id: 'wilde-1', authorId: 'wilde', text: 'Be yourself; everyone else is already taken.' },
    { id: 'wilde-2', authorId: 'wilde', text: 'To live is the rarest thing in the world. Most people exist, that is all.' },
    { id: 'wilde-3', authorId: 'wilde', text: 'We are all in the gutter, but some of us are looking at the stars.' },
    { id: 'wilde-4', authorId: 'wilde', text: 'Always forgive your enemies; nothing annoys them so much.' },
    { id: 'wilde-5', authorId: 'wilde', text: 'A man who does not think for himself does not think at all.' },
    { id: 'wilde-6', authorId: 'wilde', text: 'I can resist everything except temptation.' },
    { id: 'wilde-7', authorId: 'wilde', text: 'Every saint has a past, and every sinner has a future.' },
    { id: 'wilde-8', authorId: 'wilde', text: 'To define is to limit.' },
    { id: 'wilde-9', authorId: 'wilde', text: 'I am not young enough to know everything.' },
    { id: 'wilde-10', authorId: 'wilde', text: 'The truth is rarely pure and never simple.' },
    { id: 'wilde-11', authorId: 'wilde', text: 'With age comes wisdom, but sometimes age comes alone.' },
    { id: 'wilde-12', authorId: 'wilde', text: 'A good friend will always stab you in the front.' }] },

  { id: 'keller', name: 'Helen Keller', bio: 'Author and disability-rights advocate.', themes: ['resilience', 'courage', 'hope', 'purpose', 'friendship', 'action'], quotes: [
    { id: 'keller-1', authorId: 'keller', text: 'Alone we can do so little; together we can do so much.' },
    { id: 'keller-2', authorId: 'keller', text: 'Optimism is the faith that leads to achievement.' },
    { id: 'keller-3', authorId: 'keller', text: 'The best and most beautiful things in the world cannot be seen or even touched — they must be felt with the heart.' },
    { id: 'keller-4', authorId: 'keller', text: 'When one door of happiness closes, another opens; but often we look so long at the closed door that we do not see the one which has been opened for us.' },
    { id: 'keller-5', authorId: 'keller', text: 'Character cannot be developed in ease and quiet. Only through experience of trial and suffering can the soul be strengthened.' },
    { id: 'keller-6', authorId: 'keller', text: 'Life is either a daring adventure or nothing at all.' },
    { id: 'keller-7', authorId: 'keller', text: 'The most pathetic person in the world is someone who has sight but no vision.' },
    { id: 'keller-8', authorId: 'keller', text: 'Although the world is full of suffering, it is also full of the overcoming of it.' },
    { id: 'keller-9', authorId: 'keller', text: 'Keep your face to the sunshine and you cannot see a shadow.' },
    { id: 'keller-10', authorId: 'keller', text: 'No pessimist ever discovered the secret of the stars, or sailed to an uncharted land, or opened a new doorway for the human spirit.' },
    { id: 'keller-11', authorId: 'keller', text: 'Science may have found a cure for most evils; but it has found no remedy for the worst of them all — the apathy of human beings.' },
    { id: 'keller-12', authorId: 'keller', text: 'I long to accomplish a great and noble task, but it is my chief duty to accomplish small tasks as if they were great and noble.' }] },

  { id: 'austen', name: 'Jane Austen', bio: 'English novelist of manners and romance.', themes: ['love', 'friendship', 'humor', 'self-knowledge', 'truth'], quotes: [
    { id: 'austen-1', authorId: 'austen', text: 'There is no charm equal to tenderness of heart.' },
    { id: 'austen-2', authorId: 'austen', text: 'I declare after all there is no enjoyment like reading.' },
    { id: 'austen-3', authorId: 'austen', text: 'One half of the world cannot understand the pleasures of the other.' },
    { id: 'austen-4', authorId: 'austen', text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.' },
    { id: 'austen-5', authorId: 'austen', text: 'If I loved you less, I might be able to talk about it more.' },
    { id: 'austen-6', authorId: 'austen', text: 'The person, be it gentleman or lady, who has not pleasure in a good novel, must be intolerably stupid.' },
    { id: 'austen-7', authorId: 'austen', text: 'Think only of the past as its remembrance gives you pleasure.' },
    { id: 'austen-8', authorId: 'austen', text: 'Seldom, very seldom, does complete truth belong to any human disclosure.' },
    { id: 'austen-9', authorId: 'austen', text: 'We are all fools in love.' },
    { id: 'austen-10', authorId: 'austen', text: 'A lady\'s imagination is very rapid; it jumps from admiration to love, from love to matrimony in a moment.' },
    { id: 'austen-11', authorId: 'austen', text: 'Happiness in marriage is entirely a matter of chance.' },
    { id: 'austen-12', authorId: 'austen', text: 'I may have lost my heart, but not my self-control.' }] },

  { id: 'baldwin', name: 'James Baldwin', bio: 'Novelist and essayist on race and justice.', themes: ['justice', 'truth', 'courage', 'love', 'change', 'identity'], quotes: [
    { id: 'baldwin-1', authorId: 'baldwin', text: 'Not everything that is faced can be changed, but nothing can be changed until it is faced.' },
    { id: 'baldwin-2', authorId: 'baldwin', text: 'The world changes according to the way people see it.' },
    { id: 'baldwin-3', authorId: 'baldwin', text: 'You have to decide who you are and force the world to deal with you, not with its idea of you.' },
    { id: 'baldwin-4', authorId: 'baldwin', text: 'Love takes off masks that we fear we cannot live without and know we cannot live within.' },
    { id: 'baldwin-5', authorId: 'baldwin', text: 'I can\'t believe what you say, because I see what you do.' },
    { id: 'baldwin-6', authorId: 'baldwin', text: 'The most dangerous creation of any society is the man who has nothing to lose.' },
    { id: 'baldwin-7', authorId: 'baldwin', text: 'Love does not begin and end the way we seem to think it does. Love is a battle, love is a war; love is a growing up.' },
    { id: 'baldwin-8', authorId: 'baldwin', text: 'Not everything that is faced can be changed, but nothing can be changed until it is faced.' },
    { id: 'baldwin-9', authorId: 'baldwin', text: 'People are trapped in history and history is trapped in them.' },
    { id: 'baldwin-10', authorId: 'baldwin', text: 'To be sensual is to respect and rejoice in the force of life itself and to be present in all that one does.' },
    { id: 'baldwin-11', authorId: 'baldwin', text: 'Children have never been very good at listening to their elders, but they have never failed to imitate them.' },
    { id: 'baldwin-12', authorId: 'baldwin', text: 'Not everything that is faced can be changed. But nothing can be changed until it is faced.' }] },

  { id: 'elegant', name: 'George Eliot', bio: 'English novelist of moral depth.', themes: ['purpose', 'self-knowledge', 'love', 'change', 'wisdom'], quotes: [
    { id: 'eliot-1', authorId: 'elegant', text: 'It is never too late to be what you might have been.' },
    { id: 'eliot-2', authorId: 'elegant', text: 'What do we live for, if it is not to make life less difficult for each other?' },
    { id: 'eliot-3', authorId: 'elegant', text: 'The golden moments in the stream of life rush past us, and we see nothing but sand; the angels come to visit us, and we only know them when they are gone.' },
    { id: 'eliot-4', authorId: 'elegant', text: 'One must be poor to know the luxury of giving.' },
    { id: 'eliot-5', authorId: 'elegant', text: 'Blessed is the man who, having nothing to say, abstains from giving wordy evidence of the fact.' },
    { id: 'eliot-6', authorId: 'elegant', text: 'Our deeds determine us, as much as we determine our deeds.' },
    { id: 'eliot-7', authorId: 'elegant', text: 'Blessed is the influence of one true, loving human soul on another.' },
    { id: 'eliot-8', authorId: 'elegant', text: 'Adventure is not outside man; it is within.' },
    { id: 'eliot-9', authorId: 'elegant', text: 'The strongest principle of growth lies in human choice.' },
    { id: 'eliot-10', authorId: 'elegant', text: 'I like not only to be loved, but also to be told that I am loved.' },
    { id: 'eliot-11', authorId: 'elegant', text: 'Errors look so very ugly in persons of small means — one feels they are taking quite a liberty in going astray.' },
    { id: 'eliot-12', authorId: 'elegant', text: 'Keep true, never be ashamed of doing right; decide on what you think is right and stick to it.' }] },

  { id: 'emerson', name: 'Ralph Waldo Emerson', bio: 'Essayist and transcendentalist philosopher.', themes: ['self-knowledge', 'nature', 'solitude', 'purpose', 'courage', 'wisdom'], quotes: [
    { id: 'emerson-1', authorId: 'emerson', text: 'Nothing great was ever achieved without enthusiasm.' },
    { id: 'emerson-2', authorId: 'emerson', text: 'To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.' },
    { id: 'emerson-3', authorId: 'emerson', text: 'Do not go where the path may lead, go instead where there is no path and leave a trail.' },
    { id: 'emerson-4', authorId: 'emerson', text: 'For every minute you are angry you lose sixty seconds of happiness.' },
    { id: 'emerson-5', authorId: 'emerson', text: 'Write it on your heart that every day is the best day in the year.' },
    { id: 'emerson-6', authorId: 'emerson', text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.' },
    { id: 'emerson-7', authorId: 'emerson', text: 'Once you make a decision, the universe conspires to make it happen.' },
    { id: 'emerson-8', authorId: 'emerson', text: 'Every artist was first an amateur.' },
    { id: 'emerson-9', authorId: 'emerson', text: 'The creation of a thousand forests is in one acorn.' },
    { id: 'emerson-10', authorId: 'emerson', text: 'Life is a succession of lessons which must be lived to be understood.' },
    { id: 'emerson-11', authorId: 'emerson', text: 'It is not the length of life, but the depth of life.' },
    { id: 'emerson-12', authorId: 'emerson', text: 'The only person you are destined to become is the person you decide to be.' }] },

  { id: 'gibran', name: 'Kahlil Gibran', bio: 'Poet and artist known for lyrical wisdom.', themes: ['love', 'wisdom', 'solitude', 'friendship', 'purpose', 'freedom'], quotes: [
    { id: 'gibran-1', authorId: 'gibran', text: 'Tenderness and kindness are not signs of weakness and despair, but manifestations of strength and resolution.' },
    { id: 'gibran-2', authorId: 'gibran', text: 'Out of suffering have emerged the strongest souls.' },
    { id: 'gibran-3', authorId: 'gibran', text: 'Your joy is your sorrow unmasked.' },
    { id: 'gibran-4', authorId: 'gibran', text: 'You give but little when you give of your possessions. It is when you give of yourself that you truly give.' },
    { id: 'gibran-5', authorId: 'gibran', text: 'In the sweetness of friendship let there be laughter, and sharing of pleasures.' },
    { id: 'gibran-6', authorId: 'gibran', text: 'The deeper that sorrow carves into your being, the more joy you can contain.' },
    { id: 'gibran-7', authorId: 'gibran', text: 'We choose our joys and sorrows long before we experience them.' },
    { id: 'gibran-8', authorId: 'gibran', text: 'I have learned silence from the talkative, toleration from the intolerant, and kindness from the unkind.' },
    { id: 'gibran-9', authorId: 'gibran', text: 'Love one another, but make not a bond of love: let it rather be a moving sea between the shores of your souls.' },
    { id: 'gibran-10', authorId: 'gibran', text: 'Your children are not your children. They are the sons and daughters of Life\'s longing for itself.' },
    { id: 'gibran-11', authorId: 'gibran', text: 'Trust in dreams, for in them is hidden the gate to eternity.' },
    { id: 'gibran-12', authorId: 'gibran', text: 'If your heart is a volcano, how shall you expect flowers to bloom?' }] },

  { id: 'king', name: 'Martin Luther King Jr.', bio: 'Civil-rights leader and minister.', themes: ['justice', 'courage', 'hope', 'love', 'action', 'truth'], quotes: [
    { id: 'king-1', authorId: 'king', text: 'Darkness cannot drive out darkness; only light can do that.' },
    { id: 'king-2', authorId: 'king', text: 'The time is always right to do what is right.' },
    { id: 'king-3', authorId: 'king', text: 'Faith is taking the first step even when you don\'t see the whole staircase.' },
    { id: 'king-4', authorId: 'king', text: 'Our lives begin to end the day we become silent about things that matter.' },
    { id: 'king-5', authorId: 'king', text: 'Injustice anywhere is a threat to justice everywhere.' },
    { id: 'king-6', authorId: 'king', text: 'Life\'s most persistent and urgent question is: What are you doing for others?' },
    { id: 'king-7', authorId: 'king', text: 'Intelligence plus character — that is the goal of true education.' },
    { id: 'king-8', authorId: 'king', text: 'I have decided to stick with love. Hate is too great a burden to bear.' },
    { id: 'king-9', authorId: 'king', text: 'We must accept finite disappointment, but never lose infinite hope.' },
    { id: 'king-10', authorId: 'king', text: 'If you can\'t fly then run, if you can\'t run then walk, if you can\'t walk then crawl, but whatever you do you have to keep moving forward.' },
    { id: 'king-11', authorId: 'king', text: 'The ultimate measure of a man is not where he stands in moments of comfort and convenience, but where he stands at times of challenge and controversy.' },
    { id: 'king-12', authorId: 'king', text: 'We must learn to live together as brothers or perish together as fools.' }] },

  { id: 'lao-tzu', name: 'Lao Tzu', bio: 'Ancient philosopher, author of the Tao Te Ching.', themes: ['simplicity', 'wisdom', 'nature', 'action', 'change', 'solitude'], quotes: [
    { id: 'lao-tzu-1', authorId: 'lao-tzu', text: 'A journey of a thousand miles begins with a single step.' },
    { id: 'lao-tzu-2', authorId: 'lao-tzu', text: 'When I let go of what I am, I become what I might be.' },
    { id: 'lao-tzu-3', authorId: 'lao-tzu', text: 'Nature does not hurry, yet everything is accomplished.' },
    { id: 'lao-tzu-4', authorId: 'lao-tzu', text: 'Knowing others is intelligence; knowing yourself is true wisdom. Mastering others is strength; mastering yourself is true power.' },
    { id: 'lao-tzu-5', authorId: 'lao-tzu', text: 'Be content with what you have; rejoice in the way things are. When you realize there is nothing lacking, the whole world belongs to you.' },
    { id: 'lao-tzu-6', authorId: 'lao-tzu', text: 'Life is a series of natural and spontaneous changes. Don\'t resist them; that only creates sorrow.' },
    { id: 'lao-tzu-7', authorId: 'lao-tzu', text: 'To the mind that is still, the whole universe surrenders.' },
    { id: 'lao-tzu-8', authorId: 'lao-tzu', text: 'He who knows, does not speak. He who speaks, does not know.' },
    { id: 'lao-tzu-9', authorId: 'lao-tzu', text: 'The key to growth is the introduction of higher dimensions of consciousness into our awareness.' },
    { id: 'lao-tzu-10', authorId: 'lao-tzu', text: 'Simplicity, patience, compassion. These three are your greatest treasures.' },
    { id: 'lao-tzu-11', authorId: 'lao-tzu', text: 'When the student is ready the teacher will appear.' },
    { id: 'lao-tzu-12', authorId: 'lao-tzu', text: 'Give a man a fish and you feed him for a day. Teach him how to fish and you feed him for a lifetime.' }] },

  { id: 'lord', name: 'Audre Lorde', bio: 'Poet and activist for identity and justice.', themes: ['justice', 'identity', 'courage', 'self-knowledge', 'truth', 'creativity'], quotes: [
    { id: 'lorde-1', authorId: 'lord', text: 'Caring for myself is not self-indulgence, it is self-preservation.' },
    { id: 'lorde-2', authorId: 'lord', text: 'When I use my strength in the service of my vision, it becomes less and less important whether I am afraid.' },
    { id: 'lorde-3', authorId: 'lord', text: 'Your silence will not protect you.' },
    { id: 'lorde-4', authorId: 'lord', text: 'It is not our differences that divide us. It is our inability to recognize, accept, and celebrate those differences.' },
    { id: 'lorde-5', authorId: 'lord', text: 'I am not free while any woman is unfree, even when her shackles are very different from my own.' },
    { id: 'lorde-6', authorId: 'lord', text: 'The master\'s tools will never dismantle the master\'s house.' },
    { id: 'lorde-7', authorId: 'lord', text: 'I am deliberate and afraid of nothing.' },
    { id: 'lorde-8', authorId: 'lord', text: 'Poetry is not a luxury. It is a vital necessity of our existence.' },
    { id: 'lorde-9', authorId: 'lord', text: 'If I didn\'t define myself for myself, I would be crunched into other people\'s fantasies for me and eaten alive.' },
    { id: 'lorde-10', authorId: 'lord', text: 'Revolution is not a one-time event.' },
    { id: 'lorde-11', authorId: 'lord', text: 'It is not difference which immobilizes us, but silence.' },
    { id: 'lorde-12', authorId: 'lord', text: 'When we speak we are afraid our words will not be heard or welcomed. But when we are silent, we are still afraid. So it is better to speak.' }] },

  { id: 'marcus-aurelius', name: 'Marcus Aurelius', bio: 'Roman emperor and Stoic philosopher.', themes: ['stoicism', 'resilience', 'wisdom', 'action', 'time', 'simplicity', 'self-knowledge'], quotes: [
    { id: 'marcus-aurelius-1', authorId: 'marcus-aurelius', text: 'The happiness of your life depends upon the quality of your thoughts.' },
    { id: 'marcus-aurelius-2', authorId: 'marcus-aurelius', text: 'You have power over your mind — not outside events.' },
    { id: 'marcus-aurelius-3', authorId: 'marcus-aurelius', text: 'Waste no more time arguing about what a good man should be. Be one.' },
    { id: 'marcus-aurelius-4', authorId: 'marcus-aurelius', text: 'Very little is needed to make a happy life; it is all within yourself in your way of thinking.' },
    { id: 'marcus-aurelius-5', authorId: 'marcus-aurelius', text: 'Accept the things to which fate binds you, and love the people with whom fate brings you together.' },
    { id: 'marcus-aurelius-6', authorId: 'marcus-aurelius', text: 'Confine yourself to the present.' },
    { id: 'marcus-aurelius-7', authorId: 'marcus-aurelius', text: 'Be tolerant with others and strict with yourself.' },
    { id: 'marcus-aurelius-8', authorId: 'marcus-aurelius', text: 'Perfection of character is this: to live each day as if it were your last, without frenzy, without apathy, without pretense.' },
    { id: 'marcus-aurelius-9', authorId: 'marcus-aurelius', text: 'Never let the future disturb you. You will meet it, if you have to, with the same weapons of reason which today arm you against the present.' },
    { id: 'marcus-aurelius-10', authorId: 'marcus-aurelius', text: 'If someone is able to show me that what I think or do is not right, I will happily change.' },
    { id: 'marcus-aurelius-11', authorId: 'marcus-aurelius', text: 'The object of life is not to be on the side of the majority, but to escape finding oneself in the ranks of the insane.' },
    { id: 'marcus-aurelius-12', authorId: 'marcus-aurelius', text: 'When you wake up in the morning, tell yourself: the people I deal with today will be meddling, ungrateful, arrogant, dishonest, jealous and surly. They are this way because they cannot tell good from evil.' }] },

  { id: 'roosevelt', name: 'Eleanor Roosevelt', bio: 'Diplomat and human-rights champion.', themes: ['courage', 'justice', 'action', 'purpose', 'self-knowledge', 'hope'], quotes: [
    { id: 'roosevelt-1', authorId: 'roosevelt', text: 'The future belongs to those who believe in the beauty of their dreams.' },
    { id: 'roosevelt-2', authorId: 'roosevelt', text: 'No one can make you feel inferior without your consent.' },
    { id: 'roosevelt-3', authorId: 'roosevelt', text: 'You gain strength, courage, and confidence by every experience in which you really stop to look fear in the face.' },
    { id: 'roosevelt-4', authorId: 'roosevelt', text: 'Do one thing every day that scares you.' },
    { id: 'roosevelt-5', authorId: 'roosevelt', text: 'Beautiful young people are accidents of nature, but beautiful old people are works of art.' },
    { id: 'roosevelt-6', authorId: 'roosevelt', text: 'A woman is like a tea bag — you can\'t tell how strong she is until you put her in hot water.' },
    { id: 'roosevelt-7', authorId: 'roosevelt', text: 'With the new day comes new strength and new thoughts.' },
    { id: 'roosevelt-8', authorId: 'roosevelt', text: 'One\'s philosophy is not best expressed in words; it is expressed in the choices one makes.' },
    { id: 'roosevelt-9', authorId: 'roosevelt', text: 'Great minds discuss ideas; average minds discuss events; small minds discuss people.' },
    { id: 'roosevelt-10', authorId: 'roosevelt', text: 'Happiness is not a goal; it is a by-product of a life well lived.' },
    { id: 'roosevelt-11', authorId: 'roosevelt', text: 'You must do the things you think you cannot do.' },
    { id: 'roosevelt-12', authorId: 'roosevelt', text: 'It is better to light a candle than curse the darkness.' }] },

  { id: 'rumi', name: 'Rumi', bio: 'Persian poet and mystic.', themes: ['love', 'solitude', 'wisdom', 'self-knowledge', 'change', 'freedom'], quotes: [
    { id: 'rumi-1', authorId: 'rumi', text: 'The wound is the place where the light enters you.' },
    { id: 'rumi-2', authorId: 'rumi', text: 'What you seek is seeking you.' },
    { id: 'rumi-3', authorId: 'rumi', text: 'Let yourself be silently drawn by the strange pull of what you really love. It will not lead you astray.' },
    { id: 'rumi-4', authorId: 'rumi', text: 'Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.' },
    { id: 'rumi-5', authorId: 'rumi', text: 'Don\'t grieve. Anything you lose comes round in another form.' },
    { id: 'rumi-6', authorId: 'rumi', text: 'Out beyond ideas of wrongdoing and rightdoing, there is a field. I\'ll meet you there.' },
    { id: 'rumi-7', authorId: 'rumi', text: 'Silence is the language of God; all else is poor translation.' },
    { id: 'rumi-8', authorId: 'rumi', text: 'Start a huge, foolish project, like Noah. It makes absolutely no difference what people think of you.' },
    { id: 'rumi-9', authorId: 'rumi', text: 'Raise your words, not voice. It is rain that grows flowers, not thunder.' },
    { id: 'rumi-10', authorId: 'rumi', text: 'Live life as if everything is rigged in your favor.' },
    { id: 'rumi-11', authorId: 'rumi', text: 'Be a lamp, or a lifeboat, or a ladder. Help someone\'s soul heal.' },
    { id: 'rumi-12', authorId: 'rumi', text: 'When you do things from your soul, you feel a river moving in you, a joy.' }] },

  { id: 'seneca', name: 'Seneca', bio: 'Roman Stoic philosopher and statesman.', themes: ['stoicism', 'time', 'wisdom', 'resilience', 'simplicity', 'purpose'], quotes: [
    { id: 'seneca-1', authorId: 'seneca', text: 'Luck is what happens when preparation meets opportunity.' },
    { id: 'seneca-2', authorId: 'seneca', text: 'We suffer more often in imagination than in reality.' },
    { id: 'seneca-3', authorId: 'seneca', text: 'Begin at once to live, and count each separate day as a separate life.' },
    { id: 'seneca-4', authorId: 'seneca', text: 'Difficulties strengthen the mind, as labor does the body.' },
    { id: 'seneca-5', authorId: 'seneca', text: 'Associate with people who are likely to improve you.' },
    { id: 'seneca-6', authorId: 'seneca', text: 'No man was ever wise by chance.' },
    { id: 'seneca-7', authorId: 'seneca', text: 'It is a rough road that leads to the heights of greatness.' },
    { id: 'seneca-8', authorId: 'seneca', text: 'To be everywhere is to be nowhere.' },
    { id: 'seneca-9', authorId: 'seneca', text: 'While we wait for life, life passes.' },
    { id: 'seneca-10', authorId: 'seneca', text: 'He who is brave is free.' },
    { id: 'seneca-11', authorId: 'seneca', text: 'Throw me to the wolves and I will return leading the pack.' },
    { id: 'seneca-12', authorId: 'seneca', text: 'The whole future lies in uncertainty: live immediately.' }] },

  { id: 'shakespeare', name: 'William Shakespeare', bio: 'English playwright and poet.', themes: ['love', 'time', 'truth', 'humor', 'courage', 'change'], quotes: [
    { id: 'shakespeare-1', authorId: 'shakespeare', text: 'This above all: to thine own self be true.' },
    { id: 'shakespeare-2', authorId: 'shakespeare', text: 'The better part of valour is discretion.' },
    { id: 'shakespeare-3', authorId: 'shakespeare', text: 'All the world\'s a stage, and all the men and women merely players.' },
    { id: 'shakespeare-4', authorId: 'shakespeare', text: 'We know what we are, but know not what we may be.' },
    { id: 'shakespeare-5', authorId: 'shakespeare', text: 'Good night, good night! Parting is such sweet sorrow, that I shall say good night till it be morrow.' },
    { id: 'shakespeare-6', authorId: 'shakespeare', text: 'What\'s in a name? That which we call a rose by any other name would smell as sweet.' },
    { id: 'shakespeare-7', authorId: 'shakespeare', text: 'To be, or not to be, that is the question.' },
    { id: 'shakespeare-8', authorId: 'shakespeare', text: 'Cowards die many times before their deaths; the valiant never taste of death but once.' },
    { id: 'shakespeare-9', authorId: 'shakespeare', text: 'Some are born great, some achieve greatness, and some have greatness thrust upon them.' },
    { id: 'shakespeare-10', authorId: 'shakespeare', text: 'The quality of mercy is not strained. It droppeth as the gentle rain from heaven.' },
    { id: 'shakespeare-11', authorId: 'shakespeare', text: 'Love looks not with the eyes, but with the mind, and therefore is winged Cupid painted blind.' },
    { id: 'shakespeare-12', authorId: 'shakespeare', text: 'Our doubts are traitors, and make us lose the good we oft might win, by fearing to attempt.' }] },

  { id: 'thoreau', name: 'Henry David Thoreau', bio: 'Writer and naturalist, author of Walden.', themes: ['nature', 'simplicity', 'solitude', 'purpose', 'self-knowledge', 'freedom'], quotes: [
    { id: 'thoreau-1', authorId: 'thoreau', text: 'Go confidently in the direction of your dreams. Live the life you have imagined.' },
    { id: 'thoreau-2', authorId: 'thoreau', text: 'It is not enough to be busy. So are the ants. The question is: what are we busy about?' },
    { id: 'thoreau-3', authorId: 'thoreau', text: 'The mass of men lead lives of quiet desperation.' },
    { id: 'thoreau-4', authorId: 'thoreau', text: 'Rather than love, than money, than fame, give me truth.' },
    { id: 'thoreau-5', authorId: 'thoreau', text: 'Our life is frittered away by detail. Simplify, simplify.' },
    { id: 'thoreau-6', authorId: 'thoreau', text: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life.' },
    { id: 'thoreau-7', authorId: 'thoreau', text: 'Heaven is under our feet as well as over our heads.' },
    { id: 'thoreau-8', authorId: 'thoreau', text: 'An early-morning walk is a blessing for the whole day.' },
    { id: 'thoreau-9', authorId: 'thoreau', text: 'If you have built castles in the air, your work need not be lost; that is where they should be. Now put the foundations under them.' },
    { id: 'thoreau-10', authorId: 'thoreau', text: 'Not till we are lost, in other words, not till we have lost the world, do we begin to find ourselves.' },
    { id: 'thoreau-11', authorId: 'thoreau', text: 'Live in each season as it passes; breathe the air, drink the drink, taste the fruit, and resign yourself to the influence of the earth.' },
    { id: 'thoreau-12', authorId: 'thoreau', text: 'What you get by achieving your goals is not as important as what you become by achieving your goals.' }] },

  { id: 'woolf', name: 'Virginia Woolf', bio: 'English modernist novelist and essayist.', themes: ['solitude', 'creativity', 'freedom', 'self-knowledge', 'identity', 'truth'], quotes: [
    { id: 'woolf-1', authorId: 'woolf', text: 'No need to hurry. No need to sparkle. No need to be anybody but oneself.' },
    { id: 'woolf-2', authorId: 'woolf', text: 'Arrange whatever pieces come your way.' },
    { id: 'woolf-3', authorId: 'woolf', text: 'You cannot find peace by avoiding life.' },
    { id: 'woolf-4', authorId: 'woolf', text: 'A woman must have money and a room of her own if she is to write fiction.' },
    { id: 'woolf-5', authorId: 'woolf', text: 'Lock up your libraries if you like; but there is no gate, no lock, no bolt that you can set upon the freedom of my mind.' },
    { id: 'woolf-6', authorId: 'woolf', text: 'One cannot think well, love well, sleep well, if one has not dined well.' },
    { id: 'woolf-7', authorId: 'woolf', text: 'I thought how unpleasant it is to be locked out; and I thought how it is worse, perhaps, to be locked in.' },
    { id: 'woolf-8', authorId: 'woolf', text: 'The eyes of others our prisons; their thoughts our cages.' },
    { id: 'woolf-9', authorId: 'woolf', text: 'Nothing thicker than a knife\'s blade separates happiness from melancholy.' },
    { id: 'woolf-10', authorId: 'woolf', text: 'I am rooted, but I flow.' },
    { id: 'woolf-11', authorId: 'woolf', text: 'Odd how the creative power at once brings the whole universe to order.' },
    { id: 'woolf-12', authorId: 'woolf', text: 'Growing up is losing some illusions, in order to acquire others.' }] },

  // No entry in authorPhotos for the authors below, which is deliberate rather
  // than an oversight: every surface that renders a photo already falls back to
  // the author's initial, so they read correctly until the images are dropped in
  // at assets/authors/<id>.jpg and registered there.
  { id: 'beauvoir', name: 'Simone de Beauvoir', bio: 'French existentialist philosopher and feminist theorist.', themes: ['freedom', 'identity', 'change', 'self-knowledge', 'justice', 'truth'], quotes: [
    { id: 'beauvoir-1', authorId: 'beauvoir', text: 'One is not born, but rather becomes, a woman.' },
    { id: 'beauvoir-2', authorId: 'beauvoir', text: 'Change your life today. Don\'t gamble on the future, act now, without delay.' },
    { id: 'beauvoir-3', authorId: 'beauvoir', text: 'I am too intelligent, too demanding, and too resourceful for anyone to be able to take charge of me entirely.' },
    { id: 'beauvoir-4', authorId: 'beauvoir', text: 'To will oneself free is also to will others free.' },
    { id: 'beauvoir-5', authorId: 'beauvoir', text: 'Society cares for the individual only so far as he is profitable.' },
    { id: 'beauvoir-6', authorId: 'beauvoir', text: 'In the face of an obstacle which is impossible to overcome, stubbornness is stupid.' },
    { id: 'beauvoir-7', authorId: 'beauvoir', text: 'All oppression creates a state of war.' },
    { id: 'beauvoir-8', authorId: 'beauvoir', text: 'Life is occupied in both perpetuating itself and in surpassing itself.' },
    { id: 'beauvoir-9', authorId: 'beauvoir', text: 'One\'s life has value so long as one attributes value to the life of others.' },
    { id: 'beauvoir-10', authorId: 'beauvoir', text: 'It is old age, rather than death, that is to be contrasted with life.' },
    { id: 'beauvoir-11', authorId: 'beauvoir', text: 'I wish that every human life might be pure transparent freedom.' },
    { id: 'beauvoir-12', authorId: 'beauvoir', text: 'Self-knowledge is no guarantee of happiness, but it is on the side of happiness and can supply the courage to fight for it.' }] },

  { id: 'confucius', name: 'Confucius', bio: 'Chinese philosopher and teacher of ethics.', themes: ['wisdom', 'action', 'self-knowledge', 'purpose', 'truth', 'time'], quotes: [
    { id: 'confucius-1', authorId: 'confucius', text: 'It does not matter how slowly you go as long as you do not stop.' },
    { id: 'confucius-2', authorId: 'confucius', text: 'Our greatest glory is not in never falling, but in rising every time we fall.' },
    { id: 'confucius-3', authorId: 'confucius', text: 'Everything has beauty, but not everyone sees it.' },
    { id: 'confucius-4', authorId: 'confucius', text: 'The man who moves a mountain begins by carrying away small stones.' },
    { id: 'confucius-5', authorId: 'confucius', text: 'When it is obvious that the goals cannot be reached, adjust the action steps.' },
    { id: 'confucius-6', authorId: 'confucius', text: 'Real knowledge is to know the extent of one\'s ignorance.' },
    { id: 'confucius-7', authorId: 'confucius', text: 'Study the past if you would define the future.' },
    { id: 'confucius-8', authorId: 'confucius', text: 'He who learns but does not think is lost. He who thinks but does not learn is in great danger.' },
    { id: 'confucius-9', authorId: 'confucius', text: 'Wherever you go, go with all your heart.' },
    { id: 'confucius-10', authorId: 'confucius', text: 'Before you embark on a journey of revenge, dig two graves.' },
    { id: 'confucius-11', authorId: 'confucius', text: 'The superior man is modest in his speech but exceeds in his actions.' },
    { id: 'confucius-12', authorId: 'confucius', text: 'Life is really simple, but we insist on making it complicated.' }] },

  { id: 'curie', name: 'Marie Curie', bio: 'Physicist and chemist, twice a Nobel laureate.', themes: ['courage', 'purpose', 'action', 'hope', 'wisdom', 'resilience'], quotes: [
    { id: 'curie-1', authorId: 'curie', text: 'Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.' },
    { id: 'curie-2', authorId: 'curie', text: 'Be less curious about people and more curious about ideas.' },
    { id: 'curie-3', authorId: 'curie', text: 'I was taught that the way of progress was neither swift nor easy.' },
    { id: 'curie-4', authorId: 'curie', text: 'One never notices what has been done; one can only see what remains to be done.' },
    { id: 'curie-5', authorId: 'curie', text: 'Life is not easy for any of us. But what of that? We must have perseverance and above all confidence in ourselves.' },
    { id: 'curie-6', authorId: 'curie', text: 'You cannot hope to build a better world without improving the individuals.' },
    { id: 'curie-7', authorId: 'curie', text: 'I am among those who think that science has great beauty.' },
    { id: 'curie-8', authorId: 'curie', text: 'A scientist in his laboratory is not a mere technician: he is also a child confronting natural phenomena that impress him like a fairy tale.' },
    { id: 'curie-9', authorId: 'curie', text: 'First principle: never to let one\'s self be beaten down by persons or by events.' },
    { id: 'curie-10', authorId: 'curie', text: 'We must believe that we are gifted for something and that this thing must be attained.' },
    { id: 'curie-11', authorId: 'curie', text: 'It is my earnest desire that some of you should carry on this scientific work.' },
    { id: 'curie-12', authorId: 'curie', text: 'I have never believed that because I was a woman I had to claim special indulgence.' }] },

  { id: 'dickinson', name: 'Emily Dickinson', bio: 'American poet of interior life and solitude.', themes: ['hope', 'solitude', 'nature', 'time', 'truth', 'identity'], quotes: [
    { id: 'dickinson-1', authorId: 'dickinson', text: 'Hope is the thing with feathers that perches in the soul.' },
    { id: 'dickinson-2', authorId: 'dickinson', text: 'If I can stop one heart from breaking, I shall not live in vain.' },
    { id: 'dickinson-3', authorId: 'dickinson', text: 'Forever is composed of nows.' },
    { id: 'dickinson-4', authorId: 'dickinson', text: 'I dwell in possibility.' },
    { id: 'dickinson-5', authorId: 'dickinson', text: 'That it will never come again is what makes life so sweet.' },
    { id: 'dickinson-6', authorId: 'dickinson', text: 'Not knowing when the dawn will come, I open every door.' },
    { id: 'dickinson-7', authorId: 'dickinson', text: 'The soul should always stand ajar.' },
    { id: 'dickinson-8', authorId: 'dickinson', text: 'Saying nothing sometimes says the most.' },
    { id: 'dickinson-9', authorId: 'dickinson', text: 'To live is so startling it leaves little time for anything else.' },
    { id: 'dickinson-10', authorId: 'dickinson', text: 'Truth is so rare that it is delightful to tell it.' },
    { id: 'dickinson-11', authorId: 'dickinson', text: 'A word is dead when it is said, some say. I say it just begins to live that day.' },
    { id: 'dickinson-12', authorId: 'dickinson', text: 'Find ecstasy in life; the mere sense of living is joy enough.' }] },

  { id: 'douglass', name: 'Frederick Douglass', bio: 'Abolitionist, orator and writer who escaped slavery.', themes: ['justice', 'freedom', 'courage', 'action', 'truth', 'hope'], quotes: [
    { id: 'douglass-1', authorId: 'douglass', text: 'If there is no struggle, there is no progress.' },
    { id: 'douglass-2', authorId: 'douglass', text: 'Once you learn to read, you will be forever free.' },
    { id: 'douglass-3', authorId: 'douglass', text: 'It is easier to build strong children than to repair broken men.' },
    { id: 'douglass-4', authorId: 'douglass', text: 'I would unite with anybody to do right and with nobody to do wrong.' },
    { id: 'douglass-5', authorId: 'douglass', text: 'Power concedes nothing without a demand. It never did and it never will.' },
    { id: 'douglass-6', authorId: 'douglass', text: 'The limits of tyrants are prescribed by the endurance of those whom they oppress.' },
    { id: 'douglass-7', authorId: 'douglass', text: 'Knowledge makes a man unfit to be a slave.' },
    { id: 'douglass-8', authorId: 'douglass', text: 'A little learning, indeed, may be a dangerous thing, but the want of learning is a calamity to any people.' },
    { id: 'douglass-9', authorId: 'douglass', text: 'I prefer to be true to myself, even at the hazard of incurring the ridicule of others, rather than to be false and incur my own abhorrence.' },
    { id: 'douglass-10', authorId: 'douglass', text: 'Where justice is denied, where poverty is enforced, where ignorance prevails, neither persons nor property will be safe.' },
    { id: 'douglass-11', authorId: 'douglass', text: 'People might not get all they work for in this world, but they must certainly work for all they get.' },
    { id: 'douglass-12', authorId: 'douglass', text: 'The soul that is within me no man can degrade.' }] },

  { id: 'epictetus', name: 'Epictetus', bio: 'Greek Stoic philosopher born into slavery.', themes: ['stoicism', 'freedom', 'resilience', 'action', 'self-knowledge', 'wisdom'], quotes: [
    { id: 'epictetus-1', authorId: 'epictetus', text: 'It is not what happens to you, but how you react to it that matters.' },
    { id: 'epictetus-2', authorId: 'epictetus', text: 'We have two ears and one mouth so that we can listen twice as much as we speak.' },
    { id: 'epictetus-3', authorId: 'epictetus', text: 'Wealth consists not in having great possessions, but in having few wants.' },
    { id: 'epictetus-4', authorId: 'epictetus', text: 'First say to yourself what you would be; and then do what you have to do.' },
    { id: 'epictetus-5', authorId: 'epictetus', text: 'No man is free who is not master of himself.' },
    { id: 'epictetus-6', authorId: 'epictetus', text: 'Men are disturbed not by things, but by the views which they take of things.' },
    { id: 'epictetus-7', authorId: 'epictetus', text: 'He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.' },
    { id: 'epictetus-8', authorId: 'epictetus', text: 'Don\'t explain your philosophy. Embody it.' },
    { id: 'epictetus-9', authorId: 'epictetus', text: 'If you want to improve, be content to be thought foolish and stupid.' },
    { id: 'epictetus-10', authorId: 'epictetus', text: 'Circumstances do not make the man, they only reveal him to himself.' },
    { id: 'epictetus-11', authorId: 'epictetus', text: 'Any person capable of angering you becomes your master.' },
    { id: 'epictetus-12', authorId: 'epictetus', text: 'Make the best use of what is in your power, and take the rest as it happens.' }] },

  { id: 'frank', name: 'Anne Frank', bio: 'Diarist whose wartime writing became a testament of hope.', themes: ['hope', 'courage', 'resilience', 'nature', 'love', 'identity'], quotes: [
    { id: 'frank-1', authorId: 'frank', text: 'How wonderful it is that nobody need wait a single moment before starting to improve the world.' },
    { id: 'frank-2', authorId: 'frank', text: 'Whoever is happy will make others happy too.' },
    { id: 'frank-3', authorId: 'frank', text: 'In spite of everything, I still believe that people are really good at heart.' },
    { id: 'frank-4', authorId: 'frank', text: 'Think of all the beauty still left around you and be happy.' },
    { id: 'frank-5', authorId: 'frank', text: 'The best remedy for those who are afraid, lonely or unhappy is to go outside.' },
    { id: 'frank-6', authorId: 'frank', text: 'I don\'t think of all the misery, but of the beauty that still remains.' },
    { id: 'frank-7', authorId: 'frank', text: 'Everyone has inside of them a piece of good news.' },
    { id: 'frank-8', authorId: 'frank', text: 'Where there\'s hope, there\'s life.' },
    { id: 'frank-9', authorId: 'frank', text: 'Laziness may appear attractive, but work gives satisfaction.' },
    { id: 'frank-10', authorId: 'frank', text: 'Paper has more patience than people.' },
    { id: 'frank-11', authorId: 'frank', text: 'Look at how a single candle can both defy and define the darkness.' },
    { id: 'frank-12', authorId: 'frank', text: 'I want to go on living even after my death.' }] },

  { id: 'jung', name: 'Carl Jung', bio: 'Swiss psychiatrist and founder of analytical psychology.', themes: ['self-knowledge', 'identity', 'truth', 'change', 'wisdom', 'solitude'], quotes: [
    { id: 'jung-1', authorId: 'jung', text: 'Who looks outside, dreams; who looks inside, awakes.' },
    { id: 'jung-2', authorId: 'jung', text: 'Until you make the unconscious conscious, it will direct your life and you will call it fate.' },
    { id: 'jung-3', authorId: 'jung', text: 'The privilege of a lifetime is to become who you truly are.' },
    { id: 'jung-4', authorId: 'jung', text: 'Everything that irritates us about others can lead us to an understanding of ourselves.' },
    { id: 'jung-5', authorId: 'jung', text: 'Knowing your own darkness is the best method for dealing with the darknesses of other people.' },
    { id: 'jung-6', authorId: 'jung', text: 'I am not what happened to me, I am what I choose to become.' },
    { id: 'jung-7', authorId: 'jung', text: 'The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed.' },
    { id: 'jung-8', authorId: 'jung', text: 'Your vision will become clear only when you can look into your own heart.' },
    { id: 'jung-9', authorId: 'jung', text: 'There is no coming to consciousness without pain.' },
    { id: 'jung-10', authorId: 'jung', text: 'The shoe that fits one person pinches another; there is no recipe for living that suits all cases.' },
    { id: 'jung-11', authorId: 'jung', text: 'Loneliness does not come from having no people about one, but from being unable to communicate the things that seem important to oneself.' },
    { id: 'jung-12', authorId: 'jung', text: 'In all chaos there is a cosmos, in all disorder a secret order.' }] },

  { id: 'nietzsche', name: 'Friedrich Nietzsche', bio: 'German philosopher of will, art and self-overcoming.', themes: ['identity', 'truth', 'courage', 'creativity', 'resilience', 'purpose'], quotes: [
    { id: 'nietzsche-1', authorId: 'nietzsche', text: 'He who has a why to live can bear almost any how.' },
    { id: 'nietzsche-2', authorId: 'nietzsche', text: 'That which does not kill us makes us stronger.' },
    { id: 'nietzsche-3', authorId: 'nietzsche', text: 'You must have chaos within you to give birth to a dancing star.' },
    { id: 'nietzsche-4', authorId: 'nietzsche', text: 'There is always some madness in love. But there is also always some reason in madness.' },
    { id: 'nietzsche-5', authorId: 'nietzsche', text: 'The individual has always had to struggle to keep from being overwhelmed by the tribe.' },
    { id: 'nietzsche-6', authorId: 'nietzsche', text: 'And those who were seen dancing were thought to be insane by those who could not hear the music.' },
    { id: 'nietzsche-7', authorId: 'nietzsche', text: 'Become who you are.' },
    { id: 'nietzsche-8', authorId: 'nietzsche', text: 'Whoever fights monsters should see to it that in the process he does not become a monster.' },
    { id: 'nietzsche-9', authorId: 'nietzsche', text: 'No one can construct for you the bridge upon which precisely you must cross the stream of life.' },
    { id: 'nietzsche-10', authorId: 'nietzsche', text: 'The higher we soar, the smaller we appear to those who cannot fly.' },
    { id: 'nietzsche-11', authorId: 'nietzsche', text: 'Without music, life would be a mistake.' },
    { id: 'nietzsche-12', authorId: 'nietzsche', text: 'You have your way. I have my way. As for the right way, it does not exist.' }] },

  { id: 'tolstoy', name: 'Leo Tolstoy', bio: 'Russian novelist and moral philosopher.', themes: ['love', 'truth', 'change', 'simplicity', 'purpose', 'time'], quotes: [
    { id: 'tolstoy-1', authorId: 'tolstoy', text: 'Everyone thinks of changing the world, but no one thinks of changing himself.' },
    { id: 'tolstoy-2', authorId: 'tolstoy', text: 'If you want to be happy, be.' },
    { id: 'tolstoy-3', authorId: 'tolstoy', text: 'The two most powerful warriors are patience and time.' },
    { id: 'tolstoy-4', authorId: 'tolstoy', text: 'All happy families are alike; each unhappy family is unhappy in its own way.' },
    { id: 'tolstoy-5', authorId: 'tolstoy', text: 'There is no greatness where there is not simplicity, goodness and truth.' },
    { id: 'tolstoy-6', authorId: 'tolstoy', text: 'Nothing can make our life, or the lives of other people, more beautiful than perpetual kindness.' },
    { id: 'tolstoy-7', authorId: 'tolstoy', text: 'He who has faith in himself has no need to convince others.' },
    { id: 'tolstoy-8', authorId: 'tolstoy', text: 'True life is lived when tiny changes occur.' },
    { id: 'tolstoy-9', authorId: 'tolstoy', text: 'Everything comes in time to him who knows how to wait.' },
    { id: 'tolstoy-10', authorId: 'tolstoy', text: 'Seize the moments of happiness, love and be loved! That is the only reality in the world.' },
    { id: 'tolstoy-11', authorId: 'tolstoy', text: 'We can know only that we know nothing. And that is the highest degree of human wisdom.' },
    { id: 'tolstoy-12', authorId: 'tolstoy', text: 'Joy can only be real if people look upon their life as a service.' }] },

  { id: 'van-gogh', name: 'Vincent van Gogh', bio: 'Dutch painter who wrote as vividly as he painted.', themes: ['creativity', 'nature', 'hope', 'resilience', 'solitude', 'love'], quotes: [
    { id: 'van-gogh-1', authorId: 'van-gogh', text: 'I dream my painting and I paint my dream.' },
    { id: 'van-gogh-2', authorId: 'van-gogh', text: 'Great things are not done by impulse, but by a series of small things brought together.' },
    { id: 'van-gogh-3', authorId: 'van-gogh', text: 'If you hear a voice within you say you cannot paint, then by all means paint, and that voice will be silenced.' },
    { id: 'van-gogh-4', authorId: 'van-gogh', text: 'What would life be if we had no courage to attempt anything?' },
    { id: 'van-gogh-5', authorId: 'van-gogh', text: 'I would rather die of passion than of boredom.' },
    { id: 'van-gogh-6', authorId: 'van-gogh', text: 'Normality is a paved road: it is comfortable to walk, but no flowers grow on it.' },
    { id: 'van-gogh-7', authorId: 'van-gogh', text: 'The heart of man is very much like the sea: it has its storms, it has its tides.' },
    { id: 'van-gogh-8', authorId: 'van-gogh', text: 'There is nothing more truly artistic than to love people.' },
    { id: 'van-gogh-9', authorId: 'van-gogh', text: 'I put my heart and my soul into my work, and have lost my mind in the process.' },
    { id: 'van-gogh-10', authorId: 'van-gogh', text: 'Love many things, for therein lies the true strength.' },
    { id: 'van-gogh-11', authorId: 'van-gogh', text: 'The beginning is perhaps more difficult than anything else, but keep heart, it will turn out all right.' },
    { id: 'van-gogh-12', authorId: 'van-gogh', text: 'I am seeking, I am striving, I am in it with all my heart.' }] },

  { id: 'whitman', name: 'Walt Whitman', bio: 'American poet of the self and the open road.', themes: ['identity', 'nature', 'freedom', 'love', 'solitude', 'creativity'], quotes: [
    { id: 'whitman-1', authorId: 'whitman', text: 'Keep your face always toward the sunshine, and shadows will fall behind you.' },
    { id: 'whitman-2', authorId: 'whitman', text: 'I exist as I am, that is enough.' },
    { id: 'whitman-3', authorId: 'whitman', text: 'I celebrate myself, and sing myself.' },
    { id: 'whitman-4', authorId: 'whitman', text: 'Do I contradict myself? Very well then I contradict myself, I am large, I contain multitudes.' },
    { id: 'whitman-5', authorId: 'whitman', text: 'Resist much, obey little.' },
    { id: 'whitman-6', authorId: 'whitman', text: 'Simplicity is the glory of expression.' },
    { id: 'whitman-7', authorId: 'whitman', text: 'Not I, nor anyone else can travel that road for you. You must travel it by yourself.' },
    { id: 'whitman-8', authorId: 'whitman', text: 'Now I see the secret of the making of the best persons. It is to grow in the open air and to eat and sleep with the earth.' },
    { id: 'whitman-9', authorId: 'whitman', text: 'Happiness, not in another place but this place, not for another hour but this hour.' },
    { id: 'whitman-10', authorId: 'whitman', text: 'Long enough have you dreamed contemptible dreams.' },
    { id: 'whitman-11', authorId: 'whitman', text: 'The powerful play goes on, and you may contribute a verse.' },
    { id: 'whitman-12', authorId: 'whitman', text: 'Behold, I do not give lectures or a little charity. When I give, I give myself.' }] },

  // Chosen for provenance: every quote below traces to a named work or to an
  // ancient source that attributes it directly. Several very famous lines were
  // left out on purpose because they belong to someone else — "we are what we
  // repeatedly do" is Will Durant paraphrasing Aristotle, "between stimulus and
  // response there is a space" is Stephen Covey rather than Frankl, and "a goal
  // without a plan is just a wish" appears nowhere in Saint-Exupéry.
  { id: 'aristotle', name: 'Aristotle', bio: 'Greek philosopher, student of Plato and tutor to Alexander.', themes: ['wisdom', 'purpose', 'action', 'truth', 'friendship', 'justice'], quotes: [
    { id: 'aristotle-1', authorId: 'aristotle', text: 'All men by nature desire to know.' },
    { id: 'aristotle-2', authorId: 'aristotle', text: 'Man is by nature a political animal.' },
    { id: 'aristotle-3', authorId: 'aristotle', text: 'We become just by doing just acts, temperate by doing temperate acts, brave by doing brave acts.' },
    { id: 'aristotle-4', authorId: 'aristotle', text: 'Without friends no one would choose to live, though he had all other goods.' },
    { id: 'aristotle-5', authorId: 'aristotle', text: 'A friend is a single soul dwelling in two bodies.' },
    { id: 'aristotle-6', authorId: 'aristotle', text: 'The roots of education are bitter, but the fruit is sweet.' },
    { id: 'aristotle-7', authorId: 'aristotle', text: 'Hope is a waking dream.' },
    { id: 'aristotle-8', authorId: 'aristotle', text: 'Happiness depends upon ourselves.' },
    { id: 'aristotle-9', authorId: 'aristotle', text: 'Nature does nothing in vain.' },
    { id: 'aristotle-10', authorId: 'aristotle', text: 'The law is reason free from passion.' },
    { id: 'aristotle-11', authorId: 'aristotle', text: 'He who has never learned to obey cannot be a good commander.' },
    { id: 'aristotle-12', authorId: 'aristotle', text: 'Poverty is the parent of revolution and crime.' }] },

  { id: 'bronte', name: 'Charlotte Bronte', bio: 'English novelist, author of Jane Eyre.', themes: ['identity', 'love', 'freedom', 'courage', 'truth', 'resilience'], quotes: [
    { id: 'bronte-1', authorId: 'bronte', text: 'I am no bird; and no net ensnares me: I am a free human being with an independent will.' },
    { id: 'bronte-2', authorId: 'bronte', text: 'I would always rather be happy than dignified.' },
    { id: 'bronte-3', authorId: 'bronte', text: 'Life appears to me too short to be spent in nursing animosity or registering wrongs.' },
    { id: 'bronte-4', authorId: 'bronte', text: 'Conventionality is not morality. Self-righteousness is not religion.' },
    { id: 'bronte-5', authorId: 'bronte', text: 'I care for myself. The more solitary, the more friendless, the more unsustained I am, the more I will respect myself.' },
    { id: 'bronte-6', authorId: 'bronte', text: 'It is in vain to say human beings ought to be satisfied with tranquillity: they must have action; and they will make it if they cannot find it.' },
    { id: 'bronte-7', authorId: 'bronte', text: 'Prejudices, it is well known, are most difficult to eradicate from the heart whose soil has never been loosened or fertilised by education.' },
    { id: 'bronte-8', authorId: 'bronte', text: 'Better to be without logic than without feeling.' },
    { id: 'bronte-9', authorId: 'bronte', text: 'The soul, fortunately, has an interpreter, often an unconscious but still a truthful interpreter, in the eye.' },
    { id: 'bronte-10', authorId: 'bronte', text: 'Reason sits firm and holds the reins, and she will not let the feelings burst away.' },
    { id: 'bronte-11', authorId: 'bronte', text: 'Look twice before you leap.' },
    { id: 'bronte-12', authorId: 'bronte', text: 'Feeling without judgement is a washy draught indeed; but judgement untempered by feeling is too bitter and husky a morsel for human deglutition.' }] },

  { id: 'dickens', name: 'Charles Dickens', bio: 'English novelist and social critic of the Victorian age.', themes: ['hope', 'justice', 'love', 'change', 'humor', 'resilience'], quotes: [
    { id: 'dickens-1', authorId: 'dickens', text: 'It was the best of times, it was the worst of times.' },
    { id: 'dickens-2', authorId: 'dickens', text: 'It is a far, far better thing that I do, than I have ever done.' },
    { id: 'dickens-3', authorId: 'dickens', text: 'No one is useless in this world who lightens the burdens of another.' },
    { id: 'dickens-4', authorId: 'dickens', text: 'Have a heart that never hardens, and a temper that never tires, and a touch that never hurts.' },
    { id: 'dickens-5', authorId: 'dickens', text: 'There is a wisdom of the head, and a wisdom of the heart.' },
    { id: 'dickens-6', authorId: 'dickens', text: 'I will honour Christmas in my heart, and try to keep it all the year.' },
    { id: 'dickens-7', authorId: 'dickens', text: 'Reflect upon your present blessings, of which every man has many; not on your past misfortunes, of which all men have some.' },
    { id: 'dickens-8', authorId: 'dickens', text: 'The pain of parting is nothing to the joy of meeting again.' },
    { id: 'dickens-9', authorId: 'dickens', text: 'Every human creature is constituted to be that profound secret and mystery to every other.' },
    { id: 'dickens-10', authorId: 'dickens', text: 'Suffering has been stronger than all other teaching.' },
    { id: 'dickens-11', authorId: 'dickens', text: 'We need never be ashamed of our tears.' },
    { id: 'dickens-12', authorId: 'dickens', text: 'Take nothing on its looks; take everything on evidence. There is no better rule.' }] },

  { id: 'dostoevsky', name: 'Fyodor Dostoevsky', bio: 'Russian novelist of conscience, guilt and redemption.', themes: ['truth', 'love', 'resilience', 'self-knowledge', 'freedom', 'purpose'], quotes: [
    { id: 'dostoevsky-1', authorId: 'dostoevsky', text: 'Above all, do not lie to yourself. The man who lies to himself and listens to his own lie comes to a point that he cannot distinguish the truth within him, or around him.' },
    { id: 'dostoevsky-2', authorId: 'dostoevsky', text: 'The mystery of human existence lies not in just staying alive, but in finding something to live for.' },
    { id: 'dostoevsky-3', authorId: 'dostoevsky', text: 'Man is fond of counting his troubles, but he does not count his joys.' },
    { id: 'dostoevsky-4', authorId: 'dostoevsky', text: 'Love in action is a harsh and dreadful thing compared with love in dreams.' },
    { id: 'dostoevsky-5', authorId: 'dostoevsky', text: 'Pain and suffering are always inevitable for a large intelligence and a deep heart.' },
    { id: 'dostoevsky-6', authorId: 'dostoevsky', text: 'It takes something more than intelligence to act intelligently.' },
    { id: 'dostoevsky-7', authorId: 'dostoevsky', text: 'Taking a new step, uttering a new word, is what people fear most.' },
    { id: 'dostoevsky-8', authorId: 'dostoevsky', text: 'Beauty will save the world.' },
    { id: 'dostoevsky-9', authorId: 'dostoevsky', text: 'If you want to be respected by others, the great thing is to respect yourself.' },
    { id: 'dostoevsky-10', authorId: 'dostoevsky', text: 'What is hell? I maintain that it is the suffering of being unable to love.' },
    { id: 'dostoevsky-11', authorId: 'dostoevsky', text: 'There is only one thing that I dread: not to be worthy of my sufferings.' },
    { id: 'dostoevsky-12', authorId: 'dostoevsky', text: 'Every man has reminiscences which he would not tell to everyone, but only to his friends.' }] },

  { id: 'frankl', name: 'Viktor Frankl', bio: 'Austrian psychiatrist and Holocaust survivor, founder of logotherapy.', themes: ['purpose', 'resilience', 'freedom', 'hope', 'self-knowledge', 'love'], quotes: [
    { id: 'frankl-1', authorId: 'frankl', text: 'Everything can be taken from a man but one thing: the last of the human freedoms, to choose one\'s attitude in any given set of circumstances.' },
    { id: 'frankl-2', authorId: 'frankl', text: 'When we are no longer able to change a situation, we are challenged to change ourselves.' },
    { id: 'frankl-3', authorId: 'frankl', text: 'Life is never made unbearable by circumstances, but only by lack of meaning and purpose.' },
    { id: 'frankl-4', authorId: 'frankl', text: 'Success, like happiness, cannot be pursued; it must ensue.' },
    { id: 'frankl-5', authorId: 'frankl', text: 'The salvation of man is through love and in love.' },
    { id: 'frankl-6', authorId: 'frankl', text: 'Ultimately, man should not ask what the meaning of his life is, but rather must recognise that it is he who is asked.' },
    { id: 'frankl-7', authorId: 'frankl', text: 'Fear may come true that which one is afraid of.' },
    { id: 'frankl-8', authorId: 'frankl', text: 'Live as if you were living already for the second time and as if you had acted the first time as wrongly as you are about to act now.' },
    { id: 'frankl-9', authorId: 'frankl', text: 'The world is in a bad state, but everything will become still worse unless each of us does his best.' },
    { id: 'frankl-10', authorId: 'frankl', text: 'Suffering ceases to be suffering at the moment it finds a meaning.' },
    { id: 'frankl-11', authorId: 'frankl', text: 'It did not really matter what we expected from life, but rather what life expected from us.' },
    { id: 'frankl-12', authorId: 'frankl', text: 'Love is the ultimate and the highest goal to which man can aspire.' }] },

  { id: 'montaigne', name: 'Michel de Montaigne', bio: 'French Renaissance essayist who made the essay a form.', themes: ['self-knowledge', 'wisdom', 'humor', 'truth', 'solitude', 'time'], quotes: [
    { id: 'montaigne-1', authorId: 'montaigne', text: 'The greatest thing in the world is to know how to belong to oneself.' },
    { id: 'montaigne-2', authorId: 'montaigne', text: 'There is no conversation more boring than the one where everybody agrees.' },
    { id: 'montaigne-3', authorId: 'montaigne', text: 'I quote others only the better to express myself.' },
    { id: 'montaigne-4', authorId: 'montaigne', text: 'The most certain sign of wisdom is cheerfulness.' },
    { id: 'montaigne-5', authorId: 'montaigne', text: 'He who fears he shall suffer, already suffers what he fears.' },
    { id: 'montaigne-6', authorId: 'montaigne', text: 'Nothing is so firmly believed as that which we least know.' },
    { id: 'montaigne-7', authorId: 'montaigne', text: 'On the highest throne in the world, we still sit only on our own bottom.' },
    { id: 'montaigne-8', authorId: 'montaigne', text: 'The value of life lies not in the length of days, but in the use we make of them.' },
    { id: 'montaigne-9', authorId: 'montaigne', text: 'Lend yourself to others, but give yourself to yourself.' },
    { id: 'montaigne-10', authorId: 'montaigne', text: 'We are, I know not how, double within ourselves.' },
    { id: 'montaigne-11', authorId: 'montaigne', text: 'Man cannot make a worm, yet he will make gods by the dozen.' },
    { id: 'montaigne-12', authorId: 'montaigne', text: 'There is no desire more natural than the desire for knowledge.' }] },

  { id: 'pascal', name: 'Blaise Pascal', bio: 'French mathematician and philosopher, author of the Pensees.', themes: ['solitude', 'truth', 'wisdom', 'purpose', 'self-knowledge', 'time'], quotes: [
    { id: 'pascal-1', authorId: 'pascal', text: 'All of humanity\'s problems stem from man\'s inability to sit quietly in a room alone.' },
    { id: 'pascal-2', authorId: 'pascal', text: 'The heart has its reasons of which reason knows nothing.' },
    { id: 'pascal-3', authorId: 'pascal', text: 'Man is but a reed, the weakest in nature, but he is a thinking reed.' },
    { id: 'pascal-4', authorId: 'pascal', text: 'I have made this letter longer than usual because I lack the time to make it shorter.' },
    { id: 'pascal-5', authorId: 'pascal', text: 'We know the truth, not only by the reason, but also by the heart.' },
    { id: 'pascal-6', authorId: 'pascal', text: 'The last thing one discovers in composing a work is what to put first.' },
    { id: 'pascal-7', authorId: 'pascal', text: 'Kind words do not cost much. Yet they accomplish much.' },
    { id: 'pascal-8', authorId: 'pascal', text: 'The eternal silence of these infinite spaces frightens me.' },
    { id: 'pascal-9', authorId: 'pascal', text: 'We run carelessly to the precipice, after we have put something before us to prevent us seeing it.' },
    { id: 'pascal-10', authorId: 'pascal', text: 'Man\'s greatness lies in his power of thought.' },
    { id: 'pascal-11', authorId: 'pascal', text: 'Truth is so obscure in these times, and falsehood so established, that unless we love the truth, we cannot know it.' },
    { id: 'pascal-12', authorId: 'pascal', text: 'Curiosity is only vanity. Most frequently we wish not to know, but to talk.' }] },

  { id: 'saint-exupery', name: 'Antoine de Saint-Exupery', bio: 'French aviator and writer, author of The Little Prince.', themes: ['love', 'purpose', 'creativity', 'hope', 'friendship', 'nature'], quotes: [
    { id: 'saint-exupery-1', authorId: 'saint-exupery', text: 'It is only with the heart that one can see rightly; what is essential is invisible to the eye.' },
    { id: 'saint-exupery-2', authorId: 'saint-exupery', text: 'You become responsible, forever, for what you have tamed.' },
    { id: 'saint-exupery-3', authorId: 'saint-exupery', text: 'All grown-ups were once children, but only few of them remember it.' },
    { id: 'saint-exupery-4', authorId: 'saint-exupery', text: 'It is the time you have wasted for your rose that makes your rose so important.' },
    { id: 'saint-exupery-5', authorId: 'saint-exupery', text: 'If you want to build a ship, do not drum up people to collect wood and do not assign them tasks and work, but rather teach them to long for the endless immensity of the sea.' },
    { id: 'saint-exupery-6', authorId: 'saint-exupery', text: 'Love does not consist in gazing at each other, but in looking outward together in the same direction.' },
    { id: 'saint-exupery-7', authorId: 'saint-exupery', text: 'He who would travel happily must travel light.' },
    { id: 'saint-exupery-8', authorId: 'saint-exupery', text: 'Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.' },
    { id: 'saint-exupery-9', authorId: 'saint-exupery', text: 'What saves a man is to take a step. Then another step.' },
    { id: 'saint-exupery-10', authorId: 'saint-exupery', text: 'To be a man is, precisely, to be responsible.' },
    { id: 'saint-exupery-11', authorId: 'saint-exupery', text: 'Grown-ups never understand anything by themselves, and it is tiresome for children to be always and forever explaining things to them.' },
    { id: 'saint-exupery-12', authorId: 'saint-exupery', text: 'The earth teaches us more about ourselves than all the books.' }] },

  { id: 'sun-tzu', name: 'Sun Tzu', bio: 'Chinese general and strategist, author of The Art of War.', themes: ['wisdom', 'action', 'courage', 'truth', 'time', 'change'], quotes: [
    { id: 'sun-tzu-1', authorId: 'sun-tzu', text: 'If you know the enemy and know yourself, you need not fear the result of a hundred battles.' },
    { id: 'sun-tzu-2', authorId: 'sun-tzu', text: 'The supreme art of war is to subdue the enemy without fighting.' },
    { id: 'sun-tzu-3', authorId: 'sun-tzu', text: 'In the midst of chaos, there is also opportunity.' },
    { id: 'sun-tzu-4', authorId: 'sun-tzu', text: 'Opportunities multiply as they are seized.' },
    { id: 'sun-tzu-5', authorId: 'sun-tzu', text: 'He will win who knows when to fight and when not to fight.' },
    { id: 'sun-tzu-6', authorId: 'sun-tzu', text: 'Victorious warriors win first and then go to war, while defeated warriors go to war first and then seek to win.' },
    { id: 'sun-tzu-7', authorId: 'sun-tzu', text: 'Let your plans be dark and impenetrable as night, and when you move, fall like a thunderbolt.' },
    { id: 'sun-tzu-8', authorId: 'sun-tzu', text: 'There is no instance of a nation benefitting from prolonged warfare.' },
    { id: 'sun-tzu-9', authorId: 'sun-tzu', text: 'The general who wins the battle makes many calculations in his temple before the battle is fought.' },
    { id: 'sun-tzu-10', authorId: 'sun-tzu', text: 'Move swift as the wind and closely-formed as the wood. Attack like the fire and be still as the mountain.' },
    { id: 'sun-tzu-11', authorId: 'sun-tzu', text: 'Appear weak when you are strong, and strong when you are weak.' },
    { id: 'sun-tzu-12', authorId: 'sun-tzu', text: 'Great results can be achieved with small forces.' }] },

  { id: 'tagore', name: 'Rabindranath Tagore', bio: 'Bengali poet and polymath, the first non-European Nobel laureate in Literature.', themes: ['love', 'nature', 'hope', 'freedom', 'wisdom', 'creativity'], quotes: [
    { id: 'tagore-1', authorId: 'tagore', text: 'You can not cross the sea merely by standing and staring at the water.' },
    { id: 'tagore-2', authorId: 'tagore', text: 'Let your life lightly dance on the edges of Time like dew on the tip of a leaf.' },
    { id: 'tagore-3', authorId: 'tagore', text: 'The butterfly counts not months but moments, and has time enough.' },
    { id: 'tagore-4', authorId: 'tagore', text: 'Clouds come floating into my life, no longer to carry rain or usher storm, but to add colour to my sunset sky.' },
    { id: 'tagore-5', authorId: 'tagore', text: 'Faith is the bird that feels the light when the dawn is still dark.' },
    { id: 'tagore-6', authorId: 'tagore', text: 'I slept and dreamt that life was joy. I awoke and saw that life was service. I acted and behold, service was joy.' },
    { id: 'tagore-7', authorId: 'tagore', text: 'The stream of life that runs through my veins night and day runs through the world and dances in rhythmic measures.' },
    { id: 'tagore-8', authorId: 'tagore', text: 'Trees are the earth\'s endless effort to speak to the listening heaven.' },
    { id: 'tagore-9', authorId: 'tagore', text: 'Let me not pray to be sheltered from dangers, but to be fearless in facing them.' },
    { id: 'tagore-10', authorId: 'tagore', text: 'The small wisdom is like water in a glass: clear, transparent, pure. The great wisdom is like the water in the sea: dark, mysterious, impenetrable.' },
    { id: 'tagore-11', authorId: 'tagore', text: 'Everything comes to us that belongs to us if we create the capacity to receive it.' },
    { id: 'tagore-12', authorId: 'tagore', text: 'Death is not extinguishing the light; it is only putting out the lamp because the dawn has come.' }] },
];

export const authorById = (id: string): Author | undefined => authorsData.find((author) => author.id === id);

/**
 * The themes a quote carries: its own if it has any, otherwise its author's.
 *
 * Quotes the user wrote are the only ones that set `themes` directly — a
 * `custom:` authorId has no author record to inherit from, so without their own
 * tags they would be invisible to every theme filter and undeliverable under a
 * theme scope. Built-in quotes leave the field undefined and inherit, which is
 * what keeps themes a fact about the writer rather than 500 separate judgement
 * calls.
 *
 * Callers get an empty list rather than undefined so they can filter without a
 * guard. An explicit empty array is preserved as "tagged with nothing" rather
 * than falling through to the author, which matters when someone clears the last
 * theme off a quote they wrote.
 */
export const themesForQuote = (quote: Pick<Quote, 'authorId' | 'themes'>): ThemeId[] =>
  quote.themes ?? authorById(quote.authorId)?.themes ?? [];

/**
 * The themes actually represented in a set of quotes, in vocabulary order.
 *
 * Scraped from the quotes rather than generated from `THEMES`, because a chip
 * for a theme nobody has saved is one that can only ever empty the list — or,
 * as a delivery scope, deliver nothing and fall back. Vocabulary order rather
 * than encounter order keeps the row from reshuffling as quotes come and go.
 */
export const themesInBank = (quotes: Pick<Quote, 'authorId' | 'themes'>[]): ThemeId[] => {
  const present = new Set<ThemeId>();
  for (const quote of quotes) for (const theme of themesForQuote(quote)) present.add(theme);
  return THEMES.map(({ id }) => id).filter((id) => present.has(id));
};
