/** The user's preference. 'system' defers to the OS appearance at render time. */
export type ThemeMode = 'light' | 'dark' | 'system';

export const lightColors = {
  cream: '#FFF8ED',
  softCream: '#F8EBD8',
  taupe: '#B69A7A',
  caramel: '#B96835',
  burntCaramel: '#914723',
  chocolate: '#3D2118',
  mutedChocolate: '#6E4A3A',
  white: '#FFFCF7',
  danger: '#9F2F24',
  border: '#E8D5BF',
  gold: '#F4C994',
} as const;

export const darkColors = {
  cream: '#160C05',
  softCream: '#231208',
  taupe: '#7A5840',
  caramel: '#D48040',
  burntCaramel: '#B06030',
  chocolate: '#EDD8A8',
  mutedChocolate: '#C09060',
  white: '#2D1A0C',
  danger: '#D05040',
  border: '#4A2C18',
  gold: '#E4A864',
} as const satisfies Colors;

/**
 * Both palettes are `as const`, so their literal hex types differ. Widen the
 * values to `string` while keeping the key set exact, so every palette (light,
 * dark, and any future one) is assignable to `Colors`.
 */
export type Colors = { readonly [K in keyof typeof lightColors]: string };

export const colors = lightColors;

/**
 * Quote text is set in a serif to separate the words from the app's own voice.
 *
 * iOS ships Georgia, so this needs no bundled asset, no expo-font, and no
 * loading gate: the family resolves at first paint. Deliberately not routed
 * through `useTheme` — it varies by neither palette nor text size, and putting
 * it in the context would thread a third argument through `makeStyles(colors,
 * scale)` in five files and imply to the next reader that it is configurable.
 */
export const QUOTE_FONT = 'Georgia';
