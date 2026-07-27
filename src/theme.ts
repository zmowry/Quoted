export type ThemeMode = 'light' | 'dark';

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
} as const;

export type Colors = typeof lightColors;

export const colors = lightColors;
