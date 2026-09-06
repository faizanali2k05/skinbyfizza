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
  auth?: boolean; // default true; set false for login/signup/public reads
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(API_BASE_URL.replace(/\/$/, '') + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  return doRequest<T>(path, opts, true);
}

/**
 * A single in-flight refresh is shared by every 401'd request, so a burst of
 * parallel calls triggers one refresh rather than a stampede.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function doRequest<T>(
  path: string,
  opts: RequestOptions,
  allowRetry: boolean,
): Promise<T> {
  const { method = 'GET', body, query, auth = true, signal } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => controller.abort());

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    const aborted = e instanceof DOMException && e.name === 'AbortError';
    throw new ApiError(
      aborted ? 'The request timed out. Please try again.' : 'Network error. Check your connection.',
      0,
      null,
    );
  } finally {
    clearTimeout(timer);
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (res.status === 401 && auth && allowRetry && refreshSession) {
    if (!refreshInFlight) refreshInFlight = refreshSession().finally(() => (refreshInFlight = null));
    const ok = await refreshInFlight;
    if (ok) return doRequest<T>(path, opts, false);
    onUnauthorized();
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}
