import { useState, useEffect } from 'react';

/**
 * Hook pour debouncer une valeur
 * Utile pour optimiser les recherches en temps réel
 * 
 * @param value - Valeur à debouncer
 * @param delay - Délai en ms (défaut: 300ms)
 * @returns Valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
