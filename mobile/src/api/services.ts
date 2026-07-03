import { apiRequest } from './client';
import { endpoints } from './config';
import {
  Appointment,
  Message,
  NotificationItem,
  Procedure,
  User,
} from './types';

/**
 * Typed wrappers around the n8n webhook endpoints.
 * Endpoints marked (pending) require their n8n workflow to be built/activated;
 * the app is already wired to call them.
 */
export const api = {
  // ---- live now (skinbydrfizzag-core) ----
  getProcedures: () =>
    apiRequest<{ procedures: Procedure[] }>(endpoints.procedures, { auth: false })
      .then((r) => r.procedures ?? []),

  getMe: () => apiRequest<User>(endpoints.me),

  getAppointments: () =>
    apiRequest<{ appointments: Appointment[] }>(endpoints.appointments)
      .then((r) => r.appointments ?? []),

  getNotifications: () =>
    apiRequest<{ notifications: NotificationItem[] }>(endpoints.notifications)
      .then((r) => r.notifications ?? []),

  registerPushToken: (expo_push_token: string) =>
    apiRequest(endpoints.registerPushToken, {
      method: 'POST',
      body: { expo_push_token },
    }),

  // ---- pending backend workflow (app already wired) ----
  getChatThreads: () =>
    apiRequest<{ threads: unknown[] }>(endpoints.chatThreads).then(
      (r) => r.threads ?? [],
    ),

  pollMessages: (conversationId: string, since?: string) =>
    apiRequest<{ messages: Message[] }>(endpoints.chatPoll, {
      query: { conversation_id: conversationId, since },
    }).then((r) => r.messages ?? []),

  sendMessage: (conversationId: string, body: string) =>
    apiRequest<{ message: Message }>(endpoints.chatSend, {
      method: 'POST',
      body: { conversation_id: conversationId, body, type: 'text' },
    }),

  aiChat: (message: string, history: { role: string; content: string }[] = []) =>
    apiRequest<{ reply: string }>(endpoints.aiChat, {
      method: 'POST',
      body: { message, history },
    }),

  bookAppointment: (input: {
    procedure_id: string;
    scheduled_at: string;
    city?: string;
  }) =>
    apiRequest<{ appointment: Appointment }>(endpoints.appointmentBook, {
      method: 'POST',
      body: input,
    }),

  getPrescriptions: () =>
    apiRequest<{ prescriptions: unknown[] }>(endpoints.prescriptions).then(
      (r) => r.prescriptions ?? [],
    ),
};
