import { useCallback, useEffect, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';

/**
 * Copies text and raises `copied` for a moment so the button can flash a
 * checkmark. The timer is cleared on unmount: a quote card that scrolls away
 * (or a screen that closes) mid-flash would otherwise leave a live timer
 * holding a setter for a component that no longer exists.
 */
export function useCopyFeedback(ms = 1500): { copied: boolean; copy: (text: string) => Promise<void> } {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string): Promise<void> => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    // Restart the window on a repeat tap so the flash isn't cut short.
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), ms);
  }, [ms]);

  return { copied, copy };
}
