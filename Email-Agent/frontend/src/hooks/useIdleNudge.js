import { useEffect, useRef, useCallback } from 'react';
import { getNudge } from '../utils/personality';

export function useIdleNudge({ isListening, onNudge, enabled = true }) {
  const timerRef = useRef(null);
  const nudgeCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    if (isListening) {
      // Start a 12-second timer when mic is active
      timerRef.current = setTimeout(() => {
        const msg = getNudge(nudgeCountRef.current);
        nudgeCountRef.current++;
        if (onNudge) onNudge(msg);
      }, 12000);
    } else {
      clearTimeout(timerRef.current);
    }

    return () => clearTimeout(timerRef.current);
  }, [isListening, onNudge, enabled]);

  const resetNudge = useCallback(() => {
    nudgeCountRef.current = 0;
    clearTimeout(timerRef.current);
  }, []);

  return { resetNudge };
}
