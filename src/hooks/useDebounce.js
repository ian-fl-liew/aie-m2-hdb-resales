import { useState, useEffect } from "react";

/**
 * Delay a fast-changing value. Useful for search boxes: the input stays
 * responsive while the expensive filtering waits for a pause in typing.
 *
 *   const debouncedTerm = useDebounce(searchTerm, 300);
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // Clearing on every change is what makes this a debounce rather than a
    // queue of pending updates.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
