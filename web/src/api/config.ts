/**
 * Base URL of the backend API. Always absolute — never a same-origin path —
 * because a Capacitor build runs from capacitor://localhost and would resolve
 * a relative /api against the app bundle instead of the server.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8121';

export const REQUEST_TIMEOUT_MS = 20000;

/** The API contract — mirrors api/src/routes/*. */
export const endpoints = {
  signup: '/auth/signup',
  login: '/auth/login',
  refresh: '/auth/refresh',
  me: '/me',
  profileUpdate: '/profile/update',
  chatThreads: '/chat/threads',
  chatPoll: '/chat/poll',
  chatSend: '/chat/send',
  chatSetPrimary: '/chat/set-primary',
  chatTagDoctor: '/chat/tag-doctor',
  appointments: '/appointments',
  appointmentBook: '/appointments/book',
  appointmentAssign: '/appointments/assign',
  procedures: '/procedures',
  prescriptions: '/prescriptions',
  instructions: '/instructions',
  notifications: '/notifications',
  users: '/users',
  about: '/about',
  aiChat: '/ai/chat',
} as const;
