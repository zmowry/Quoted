import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren, ReactElement } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/src/services/storage';
import { lightColors, darkColors } from '@/src/theme';
import type { Colors, ThemeMode } from '@/src/theme';

export type TextSize = 'small' | 'medium' | 'large';
const TEXT_SCALES: Record<TextSize, number> = { small: 0.85, medium: 1, large: 1.2 };
const THEME_KEY = STORAGE_KEYS.theme;
const TEXT_SIZE_KEY = STORAGE_KEYS.textSize;
const isMode = (v: string | null): v is ThemeMode => v === 'light' || v === 'dark' || v === 'system';

interface ThemeContextValue {
  colors: Colors;
  /** The stored preference, which may be 'system'. */
  mode: ThemeMode;
  /** What 'system' actually resolved to — use this to render, not `mode`. */
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => Promise<void>;
  textSize: TextSize;
  setTextSize: (size: TextSize) => Promise<void>;
  scale: (n: number) => number;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren): ReactElement {
  // Light rather than 'system'. The palette this app is built around is a warm
  // cream-and-chocolate one, and someone whose phone happens to be in dark mode
  // should meet that on first launch rather than the inverted version of it.
  // 'system' stays on offer in settings, it just is not what you land on.
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [textSize, setTextSizeState] = useState<TextSize>('medium');
  // Re-renders on its own when the OS appearance flips, so 'system' tracks live.
  const systemScheme = useColorScheme();
  const resolvedMode: 'light' | 'dark' = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  useEffect(() => {
    void Promise.all([AsyncStorage.getItem(THEME_KEY), AsyncStorage.getItem(TEXT_SIZE_KEY)]).then(([storedMode, storedSize]) => {
      if (isMode(storedMode)) setModeState(storedMode);
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
    <ThemeContext.Provider value={{ colors: resolvedMode === 'dark' ? darkColors : lightColors, mode, resolvedMode, setMode, textSize, setTextSize, scale }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
