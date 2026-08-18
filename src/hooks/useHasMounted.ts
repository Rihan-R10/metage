import { useSyncExternalStore } from 'react';

/**
 * Returns `true` only after the component has mounted on the client.
 *
 * Uses `useSyncExternalStore` so the server snapshot (`false`) matches the
 * first client render, avoiding SSR/client hydration mismatches from
 * store-derived values (e.g. Zustand) while not triggering setState in an
 * effect.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
