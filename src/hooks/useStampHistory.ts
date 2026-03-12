/**
 * Undo/Redo history hook for stamp form state.
 * Stores up to 50 snapshots, debounced at 300ms.
 */
import { useRef, useCallback, useState } from 'react';

export interface StampHistoryActions<T> {
  push: (state: T) => void;
  undo: () => T | null;
  redo: () => T | null;
  canUndo: boolean;
  canRedo: boolean;
  reset: (initial: T) => void;
}

const MAX_HISTORY = 50;

export function useStampHistory<T>(initialState: T): StampHistoryActions<T> {
  const history = useRef<T[]>([initialState]);
  const pointer = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, forceUpdate] = useState(0);

  const push = useCallback((state: T) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      // Truncate any redo states
      history.current = history.current.slice(0, pointer.current + 1);
      history.current.push(JSON.parse(JSON.stringify(state)));
      if (history.current.length > MAX_HISTORY) {
        history.current.shift();
      } else {
        pointer.current++;
      }
      forceUpdate(n => n + 1);
    }, 300);
  }, []);

  const undo = useCallback((): T | null => {
    if (pointer.current <= 0) return null;
    pointer.current--;
    forceUpdate(n => n + 1);
    return JSON.parse(JSON.stringify(history.current[pointer.current]));
  }, []);

  const redo = useCallback((): T | null => {
    if (pointer.current >= history.current.length - 1) return null;
    pointer.current++;
    forceUpdate(n => n + 1);
    return JSON.parse(JSON.stringify(history.current[pointer.current]));
  }, []);

  const reset = useCallback((initial: T) => {
    history.current = [JSON.parse(JSON.stringify(initial))];
    pointer.current = 0;
    forceUpdate(n => n + 1);
  }, []);

  return {
    push,
    undo,
    redo,
    canUndo: pointer.current > 0,
    canRedo: pointer.current < history.current.length - 1,
    reset,
  };
}
