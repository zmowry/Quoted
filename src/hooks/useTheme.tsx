import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren, ReactElement } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '@/src/theme';
import type { Colors, ThemeMode } from '@/src/theme';

export type TextSize = 'small' | 'medium' | 'large';
const TEXT_SCALES: Record<TextSize, number> = { small: 0.85, medium: 1, large: 1.2 };
const THEME_KEY = '@quote-bank/theme';
const TEXT_SIZE_KEY = '@quote-bank/text-size';

interface ThemeContextValue {
  colors: Colors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  textSize: TextSize;
  setTextSize: (size: TextSize) => Promise<void>;
  scale: (n: number) => number;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren): ReactElement {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [textSize, setTextSizeState] = useState<TextSize>('medium');

  useEffect(() => {
    void Promise.all([AsyncStorage.getItem(THEME_KEY), AsyncStorage.getItem(TEXT_SIZE_KEY)]).then(([storedMode, storedSize]) => {
      if (storedMode === 'dark' || storedMode === 'light') setModeState(storedMode);
      if (storedSize === 'small' || storedSize === 'medium' || storedSize === 'large') setTextSizeState(storedSize);
    });
  }, []);

  const setMode = useCallback(async (m: ThemeMode) => {
    await AsyncStorage.setItem(THEME_KEY, m);
    setModeState(m);
  }, []);

  const setTextSize = useCallback(async (s: TextSize) => {
    await AsyncStorage.setItem(TEXT_SIZE_KEY, s);
    setTextSizeState(s);
  }, []);

  const scale = useCallback((n: number) => Math.round(n * TEXT_SCALES[textSize]), [textSize]);

  return (
    <ThemeContext.Provider value={{ colors: mode === 'dark' ? darkColors : lightColors, mode, setMode, textSize, setTextSize, scale }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
