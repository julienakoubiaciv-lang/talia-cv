/**
 * useWindowWidth / useIsMobile
 * Responsive helpers pour les composants inline-styled.
 */
import { useState, useEffect } from 'react';

export function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

/** true si la largeur est inférieure au breakpoint (défaut 768px) */
export function useIsMobile(breakpoint = 768) {
  return useWindowWidth() < breakpoint;
}
