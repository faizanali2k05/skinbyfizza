import Constants from 'expo-constants';

/**
 * Base URL of the backend API (Node/Express on the VPS). Override per-env via
 * app.json -> expo.extra.apiBaseUrl, or an EXPO_PUBLIC_API_BASE_URL env var.
 * Every endpoint below is appended to this. The AI consultant (/ai/chat) is
 * proxied by the backend to the n8n AI agent.
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://skinapi.seemaai.co.uk';

export const REQUEST_TIMEOUT_MS = 20000;

/** n8n webhook paths — the API contract (see docs/ARCHITECTURE.md §4). */
export const endpoints = {
  signup: '/auth/signup',
  login: '/auth/login',
  refresh: '/auth/refresh',
  me: '/me',
  profileUpdate: '/profile/update',
  profilePhoto: '/profile/photo',
  chatThreads: '/chat/threads',
  chatPoll: '/chat/poll',
  chatSend: '/chat/send',
  chatSetPrimary: '/chat/set-primary',
  chatTagDoctor: '/chat/tag-doctor',
  appointments: '/appointments',
  appointmentAssign: '/appointments/assign',
  appointmentReschedule: '/appointments/reschedule',
  procedures: '/procedures',
  prescriptions: '/prescriptions',
  instructions: '/instructions',
  notifications: '/notifications',
  registerPushToken: '/push/register-token',
  aiChat: '/ai/chat',
  aiBeforeAfter: '/ai/before-after',
} as const;
