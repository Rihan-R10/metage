import { useEffect, useState } from 'react';

/**
 * Returns `true` only after the component has mounted on the client.
 *
 * Use this to prevent SSR/client hydration mismatches caused by
 * store-derived values (e.g. Zustand) that differ between the server
 * render and the first client render.
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
