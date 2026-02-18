import { useState, useEffect } from 'react';

/**
 * Subscribes to a media query and returns whether it matches.
 * Use for responsive component behavior (e.g. abbreviated labels on mobile).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const m = window.matchMedia(query);
    setMatches(m.matches);
    const listener = () => setMatches(m.matches);
    m.addEventListener('change', listener);
    return () => m.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
