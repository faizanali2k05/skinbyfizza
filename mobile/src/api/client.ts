import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type TokenProvider = () => string | null;
type Unauthorized = () => void;
type Refresher = () => Promise<boolean>;

let getToken: TokenProvider = () => null;
let onUnauthorized: Unauthorized = () => {};
let refreshSession: Refresher | null = null;

/** Wired up once by AuthProvider so the client can attach the JWT + react to 401s. */
export function configureApi(opts: {
  getToken: TokenProvider;
  onUnauthorized: Unauthorized;
  refreshSession?: Refresher;
}) {
  getToken = opts.getToken;
  onUnauthorized = opts.onUnauthorized;
  refreshSession = opts.refreshSession ?? null;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean; // default true; set false for login/signup
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(API_BASE_URL.replace(/\/$/, '') + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export async function apiRequest<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  return doRequest<T>(path, opts, true);
}

async function doRequest<T>(
  path: string,
  opts: RequestOptions,
  allowRefresh: boolean,
): Promise<T> {
  const { method = 'GET', body, query, auth = true, signal } = opts;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => controller.abort());

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? safeJson(text) : null;

    if (res.status === 401) {
      // Access token likely expired — try one silent refresh, then retry.
      if (auth && allowRefresh && refreshSession) {
        clearTimeout(timeout);
        const ok = await refreshSession().catch(() => false);
        if (ok) return doRequest<T>(path, opts, false);
      }
      onUnauthorized();
      throw new ApiError('Unauthorized', 401, data);
    }
    if (!res.ok) {
      const msg =
        (data as { message?: string })?.message ?? `Request failed (${res.status})`;
      throw new ApiError(msg, res.status, data);
    }
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new ApiError('Request timed out', 0, null);
    }
    throw new ApiError((err as Error).message || 'Network error', 0, null);
  } finally {
    clearTimeout(timeout);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
