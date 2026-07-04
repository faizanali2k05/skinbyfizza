import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

type Options = {
  /** Re-fetch every time the screen regains focus (keeps staff data in sync). */
  refetchOnFocus?: boolean;
};

/**
 * Minimal data-fetching hook: runs `fn` on mount (and when `deps` change),
 * exposes { data, loading, error, refetch, setData }.
 */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = [], opts: Options = {}) {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const mounted = useRef(true);

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      if (mounted.current) setState({ data, loading: false, error: null });
    } catch (e) {
      if (mounted.current)
        setState({ data: null, loading: false, error: (e as Error).message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => {
      mounted.current = false;
    };
  }, [run]);

  // Refresh on focus (skip the very first focus — mount already fetched).
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (!opts.refetchOnFocus) return;
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      run();
    }, [run, opts.refetchOnFocus]),
  );

  /** Optimistically patch the cached data (revert by calling refetch on error). */
  const setData = useCallback((updater: T | ((prev: T | null) => T)) => {
    setState((s) => ({
      ...s,
      data:
        typeof updater === 'function'
          ? (updater as (prev: T | null) => T)(s.data)
          : updater,
    }));
  }, []);

  return { ...state, refetch: run, setData };
}
