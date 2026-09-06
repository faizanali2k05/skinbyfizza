import { useCallback, useEffect, useRef, useState } from 'react';

type Options = {
  /** Refetch when the tab regains focus/visibility (staff lists rely on this). */
  refetchOnFocus?: boolean;
  /** Poll while the tab is visible, in ms. */
  pollMs?: number;
  /** Skip fetching entirely (e.g. unauthenticated). */
  enabled?: boolean;
};

type Result<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  setData: (patch: (current: T | null) => T) => void;
};

/**
 * Small data hook — the web port of mobile/src/hooks/useQuery.ts.
 * `setData` exists for optimistic updates: patch the cache immediately, then
 * refetch on failure to fall back to server truth.
 */
export function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: Options = {},
): Result<T> {
  const { refetchOnFocus = false, pollMs, enabled = true } = options;

  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const mounted = useRef(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetcherRef.current()
      .then((res) => {
        if (cancelled || !mounted.current) return;
        setDataState(res);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled || !mounted.current) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled && mounted.current) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, enabled, ...deps]);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  // Refetch when the tab becomes visible again.
  useEffect(() => {
    if (!refetchOnFocus || !enabled) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refetch);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refetch);
    };
  }, [refetchOnFocus, enabled, refetch]);

  // Poll only while visible — a hidden tab must not hammer the API.
  useEffect(() => {
    if (!pollMs || !enabled) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') refetch();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, enabled, refetch]);

  const setData = useCallback((patch: (current: T | null) => T) => {
    setDataState((current) => patch(current));
  }, []);

  return { data, loading, error, refetch, setData };
}
