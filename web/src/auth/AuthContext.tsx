import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { apiRequest, configureApi } from '../api/client';
import { endpoints } from '../api/config';
import { AuthResponse, User } from '../api/types';
import { storage } from '../platform/storage';

const TOKEN_KEY = 'skin.token';
const REFRESH_KEY = 'skin.refresh';
const USER_KEY = 'skin.user';

type SignUpInput = {
  full_name: string;
  phone_e164: string;
  email?: string;
  city?: string;
  password: string;
};

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  signIn: (identifier: string, password: string) => Promise<User>;
  signUp: (input: SignUpInput) => Promise<User>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Tokens live in refs so the api client reads the current value synchronously
  // without a re-render race.
  const tokenRef = useRef<string | null>(null);
  const refreshRef = useRef<string | null>(null);

  const persist = useCallback(async (token: string, refresh: string, u: User) => {
    tokenRef.current = token;
    refreshRef.current = refresh;
    setUser(u);
    await Promise.all([
      storage.set(TOKEN_KEY, token),
      storage.set(REFRESH_KEY, refresh),
      storage.set(USER_KEY, JSON.stringify(u)),
    ]);
  }, []);

  const clear = useCallback(async () => {
    tokenRef.current = null;
    refreshRef.current = null;
    setUser(null);
    await Promise.all([
      storage.remove(TOKEN_KEY),
      storage.remove(REFRESH_KEY),
      storage.remove(USER_KEY),
    ]);
  }, []);

  /** Exchange the refresh token for a fresh access token. */
  const doRefresh = useCallback(async (): Promise<boolean> => {
    const refresh = refreshRef.current;
    if (!refresh) return false;
    try {
      const res = await apiRequest<{ token: string }>(endpoints.refresh, {
        method: 'POST',
        body: { refresh },
        auth: false,
      });
      if (!res?.token) return false;
      tokenRef.current = res.token;
      await storage.set(TOKEN_KEY, res.token);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Wire the api client to this session exactly once.
  useEffect(() => {
    configureApi({
      getToken: () => tokenRef.current,
      onUnauthorized: () => {
        void clear();
      },
      refreshSession: doRefresh,
    });
  }, [clear, doRefresh]);

  // Restore the session on boot.
  useEffect(() => {
    (async () => {
      const [token, refresh, cached] = await Promise.all([
        storage.get(TOKEN_KEY),
        storage.get(REFRESH_KEY),
        storage.get(USER_KEY),
      ]);
      tokenRef.current = token;
      refreshRef.current = refresh;
      if (cached) {
        try {
          setUser(JSON.parse(cached) as User);
        } catch {
          /* corrupt cache — ignored, /me below is the source of truth */
        }
      }
      if (token) {
        try {
          const fresh = await apiRequest<User>(endpoints.me);
          setUser(fresh);
          await storage.set(USER_KEY, JSON.stringify(fresh));
        } catch {
          // 401 already triggered a refresh attempt inside the client; if we
          // still can't identify the user, drop the stale session.
          if (!tokenRef.current) await clear();
        }
      }
      setInitializing(false);
    })();
  }, [clear]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const res = await apiRequest<AuthResponse>(endpoints.login, {
        method: 'POST',
        body: { identifier: identifier.trim(), password },
        auth: false,
      });
      await persist(res.token, res.refresh, res.user);
      return res.user;
    },
    [persist],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const res = await apiRequest<AuthResponse>(endpoints.signup, {
        method: 'POST',
        body: input,
        auth: false,
      });
      await persist(res.token, res.refresh, res.user);
      return res.user;
    },
    [persist],
  );

  const refreshUser = useCallback(async () => {
    if (!tokenRef.current) return;
    const fresh = await apiRequest<User>(endpoints.me);
    setUser(fresh);
    await storage.set(USER_KEY, JSON.stringify(fresh));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAuthenticated: !!user && !!tokenRef.current,
      isStaff: user?.role === 'doctor' || user?.role === 'manager',
      signIn,
      signUp,
      signOut: clear,
      refreshUser,
    }),
    [user, initializing, signIn, signUp, clear, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/**
 * Role gate mirroring the server checks in api/src/routes/users.js.
 * Forbidden controls are never rendered — the API rejects them too, but the UI
 * must not offer an action the user cannot take.
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;
  const isDoctor = role === 'doctor';
  const isStaff = role === 'doctor' || role === 'manager';
  return {
    isDoctor,
    isManager: role === 'manager',
    isStaff,
    deleteUser: isDoctor,
    setUserStatus: isDoctor,
    setUserRole: isDoctor,
    setRating: isDoctor,
    setVip: isDoctor,
    writeRx: isDoctor,
    writeInstruction: isDoctor,
    registerLead: isStaff,
    triage: isStaff,
    manageProcedures: isStaff,
    manageAppointments: isStaff,
  };
}
