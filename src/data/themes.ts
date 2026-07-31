/**
 * The fixed vocabulary of themes an author can be tagged with.
 *
 * A closed set rather than free-form strings: `ThemeId` is derived from this
 * array, so a typo in `authorsData` is a type error rather than a theme that
 * silently filters to nothing. It also means the filter UI can be generated from
 * the vocabulary instead of scraped out of the data, so a theme nobody is tagged
 * with still can't appear as a dead chip.
 */
export const THEMES = [
  { id: 'action', label: 'Action' },
  { id: 'change', label: 'Change' },
  { id: 'courage', label: 'Courage' },
  { id: 'creativity', label: 'Creativity' },
  { id: 'freedom', label: 'Freedom' },
  { id: 'friendship', label: 'Friendship' },
  { id: 'hope', label: 'Hope' },
  { id: 'humor', label: 'Humor' },
  { id: 'identity', label: 'Identity' },
  { id: 'justice', label: 'Justice' },
  { id: 'love', label: 'Love' },
  { id: 'nature', label: 'Nature' },
  { id: 'purpose', label: 'Purpose' },
  { id: 'resilience', label: 'Resilience' },
  { id: 'self-knowledge', label: 'Self-knowledge' },
  { id: 'simplicity', label: 'Simplicity' },
  { id: 'solitude', label: 'Solitude' },
  { id: 'stoicism', label: 'Stoicism' },
  { id: 'time', label: 'Time' },
  { id: 'truth', label: 'Truth' },
  { id: 'wisdom', label: 'Wisdom' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const LABELS: Record<string, string> = Object.fromEntries(THEMES.map((theme) => [theme.id, theme.label]));

/**
 * Falls back to the raw id rather than throwing: a theme written by an older or
 * newer build of the data should render as itself, not crash the author list.
 */
export const themeLabel = (id: string): string => LABELS[id] ?? id;
