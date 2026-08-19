import { useCallback, useEffect, useRef } from "react";

export type DebouncedCallback<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 400
): DebouncedCallback<T> {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  // Always keep track of the latest callback reference
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up pending timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as DebouncedCallback<T>;

  debounced.cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return debounced;
}
