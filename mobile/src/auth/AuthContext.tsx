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
import { deleteItem, getItem, KEYS, setItem } from './storage';

type AuthState = {
  user: User | null;
  token: string | null;
  initializing: boolean;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  signIn: (identifier: string, password: string) => Promise<User>;
  signUp: (input: SignUpInput) => Promise<User>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export type SignUpInput = {
  full_name: string;
  phone_e164: string;
  email?: string;
  password: string;
  city?: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    initializing: true,
  });

  // Keep a ref so the api client always reads the latest token synchronously.
  const tokenRef = useRef<string | null>(null);

  const applySession = useCallback(async (res: AuthResponse) => {
    tokenRef.current = res.token;
    await Promise.all([
      setItem(KEYS.token, res.token),
      setItem(KEYS.refresh, res.refresh),
      setItem(KEYS.user, JSON.stringify(res.user)),
    ]);
    setState({ user: res.user, token: res.token, initializing: false });
  }, []);

  const clearSession = useCallback(async () => {
    tokenRef.current = null;
    await Promise.all([
      deleteItem(KEYS.token),
      deleteItem(KEYS.refresh),
      deleteItem(KEYS.user),
    ]);
    setState({ user: null, token: null, initializing: false });
  }, []);

  // Wire the api client to this provider's token + 401 handler.
  useEffect(() => {
    configureApi({
      getToken: () => tokenRef.current,
      onUnauthorized: () => {
        void clearSession();
      },
    });
  }, [clearSession]);

  // Restore a saved session on launch.
  useEffect(() => {
    (async () => {
      try {
        const [token, userRaw] = await Promise.all([
          getItem(KEYS.token),
          getItem(KEYS.user),
        ]);
        if (token && userRaw) {
          tokenRef.current = token;
          setState({ user: JSON.parse(userRaw), token, initializing: false });
        } else {
          setState((s) => ({ ...s, initializing: false }));
        }
      } catch {
        setState((s) => ({ ...s, initializing: false }));
      }
    })();
  }, []);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const res = await apiRequest<AuthResponse>(endpoints.login, {
        method: 'POST',
        auth: false,
        body: { identifier: identifier.trim(), password },
      });
      await applySession(res);
      return res.user;
    },
    [applySession],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const res = await apiRequest<AuthResponse>(endpoints.signup, {
        method: 'POST',
        auth: false,
        body: input,
      });
      await applySession(res);
      return res.user;
    },
    [applySession],
  );

  const refreshUser = useCallback(async () => {
    const user = await apiRequest<User>(endpoints.me);
    await setItem(KEYS.user, JSON.stringify(user));
    setState((s) => ({ ...s, user }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: !!state.token,
      signIn,
      signUp,
      signOut: clearSession,
      refreshUser,
    }),
    [state, signIn, signUp, clearSession, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
