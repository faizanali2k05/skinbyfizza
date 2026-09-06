/**
 * Storage seam. Async-first on purpose: the Capacitor Preferences API is async,
 * so writing this synchronously today would force a rewrite at wrap time.
 * Swap the body for @capacitor/preferences in the native build — callers never
 * change. Every access is guarded: private mode and blocked site data throw.
 */
export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* quota or blocked storage — non-fatal */
    }
  },

  async remove(key: string): Promise<void> {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/** Synchronous best-effort read, used only for first paint (theme/locale). */
export function readSync(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
