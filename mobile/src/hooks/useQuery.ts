import { useCallback, useEffect, useRef, useState } from 'react';

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

/**
 * Minimal data-fetching hook: runs `fn` on mount (and when `deps` change),
 * exposes { data, loading, error, refetch }. No caching — good enough for
 * the app's screens that read from n8n.
 */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []) {
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

  return { ...state, refetch: run };
}
