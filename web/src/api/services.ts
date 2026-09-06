import { apiRequest } from './client';
import { endpoints } from './config';
import {
  AboutResponse,
  Appointment,
  AppointmentStatus,
  ConsultationInput,
  Instruction,
  Message,
  NotificationItem,
  Prescription,
  Procedure,
  Thread,
  User,
} from './types';

/** Typed wrappers around the backend API — same contract as the Expo client. */
export const api = {
  // ---- catalogue ----
  getProcedures: () =>
    apiRequest<{ procedures: Procedure[] }>(endpoints.procedures, { auth: false }).then(
      (r) => r.procedures ?? [],
    ),

  createProcedure: (input: Partial<Procedure>) =>
    apiRequest<{ procedure: Procedure }>(endpoints.procedures, { method: 'POST', body: input }),

  updateProcedure: (id: string, input: Partial<Procedure>) =>
    apiRequest<{ procedure: Procedure }>(`${endpoints.procedures}/${id}`, {
      method: 'PUT',
      body: input,
    }),

  deleteProcedure: (id: string) =>
    apiRequest<{ ok: boolean }>(`${endpoints.procedures}/${id}`, { method: 'DELETE' }),

  // ---- profile ----
  getMe: () => apiRequest<User>(endpoints.me),

  updateProfile: (input: Partial<User>) =>
    apiRequest<User>(endpoints.profileUpdate, { method: 'POST', body: input }),

  // ---- appointments ----
  getAppointments: (params?: { city?: string; status?: string }) =>
    apiRequest<{ appointments: Appointment[] }>(endpoints.appointments, { query: params }).then(
      (r) => r.appointments ?? [],
    ),

  bookAppointment: (input: {
    procedure_id?: string;
    scheduled_at: string;
    city?: string;
    consultation?: ConsultationInput;
  }) => apiRequest<{ appointment: Appointment }>(endpoints.appointmentBook, { method: 'POST', body: input }),

  assignAppointment: (input: {
    user_id: string;
    procedure_id?: string;
    scheduled_at: string;
    city?: string;
  }) => apiRequest<{ appointment: Appointment }>(endpoints.appointmentAssign, { method: 'POST', body: input }),

  setAppointmentStatus: (id: string, status: AppointmentStatus) =>
    apiRequest(`${endpoints.appointments}/${id}/status`, { method: 'POST', body: { status } }),

  rescheduleAppointment: (id: string, scheduled_at: string) =>
    apiRequest(`${endpoints.appointments}/${id}/reschedule`, { method: 'POST', body: { scheduled_at } }),

  // ---- notifications ----
  getNotifications: () =>
    apiRequest<{ notifications: NotificationItem[] }>(endpoints.notifications).then(
      (r) => r.notifications ?? [],
    ),

  markNotificationRead: (id: string) =>
    apiRequest(`${endpoints.notifications}/${id}/read`, { method: 'POST' }),

  // ---- prescriptions ----
  getPrescriptions: (userId?: string) =>
    apiRequest<{ prescriptions: Prescription[] }>(endpoints.prescriptions, {
      query: userId ? { user_id: userId } : undefined,
    }).then((r) => r.prescriptions ?? []),

  createPrescription: (input: {
    user_id: string;
    item_name: string;
    price?: number;
    notes?: string;
  }) => apiRequest<{ prescription: Prescription }>(endpoints.prescriptions, { method: 'POST', body: input }),

  // ---- chat ----
  getThreads: () =>
    apiRequest<{ threads: Thread[] }>(endpoints.chatThreads).then((r) => r.threads ?? []),

  pollMessages: (conversationId: string, since?: string) =>
    apiRequest<{ messages: Message[] }>(endpoints.chatPoll, {
      query: { conversation_id: conversationId, since },
    }).then((r) => r.messages ?? []),

  sendMessage: (body: string, conversationId?: string, media?: { base64: string; mime: string }) =>
    apiRequest<{ message: Message }>(endpoints.chatSend, {
      method: 'POST',
      body: {
        conversation_id: conversationId,
        body,
        media_base64: media?.base64,
        media_mime: media?.mime,
      },
    }).then((r) => r.message),

  setPrimary: (conversationId: string) =>
    apiRequest(endpoints.chatSetPrimary, {
      method: 'POST',
      body: { conversation_id: conversationId },
    }),

  tagDoctor: (messageIds: string[]) =>
    apiRequest(endpoints.chatTagDoctor, { method: 'POST', body: { message_ids: messageIds } }),

  // ---- AI (proxied to n8n) ----
  aiChat: (message: string, history: { role: string; content: string }[] = []) =>
    apiRequest<{ reply: string }>(endpoints.aiChat, { method: 'POST', body: { message, history } }),

  // ---- users (staff) ----
  getUsers: (q?: string) =>
    apiRequest<{ users: User[] }>(endpoints.users, { query: q ? { q } : undefined }).then(
      (r) => r.users ?? [],
    ),

  registerUser: (id: string, email: string, password: string) =>
    apiRequest<{ user: User }>(`${endpoints.users}/${id}/register`, {
      method: 'POST',
      body: { email, password },
    }),

  setUserRating: (id: string, interest_rating: number) =>
    apiRequest<{ user: User }>(`${endpoints.users}/${id}/rating`, {
      method: 'POST',
      body: { interest_rating },
    }),

  setUserVip: (id: string, vip: boolean) =>
    apiRequest<{ user: User }>(`${endpoints.users}/${id}/vip`, {
      method: 'POST',
      body: { customer_type: vip ? 'vip' : 'regular' },
    }),

  setUserStatus: (id: string, status: 'active' | 'inactive') =>
    apiRequest<{ user: User }>(`${endpoints.users}/${id}/status`, {
      method: 'POST',
      body: { status },
    }),

  setUserRole: (id: string, role: 'user' | 'manager' | 'doctor') =>
    apiRequest<{ user: User }>(`${endpoints.users}/${id}/role`, { method: 'POST', body: { role } }),

  deleteUser: (id: string) => apiRequest<{ ok: boolean }>(`${endpoints.users}/${id}`, { method: 'DELETE' }),

  // ---- clinic info ----
  getAbout: () => apiRequest<AboutResponse>(endpoints.about, { auth: false }),

  // ---- doctor instructions (team-facing + doctor-self) ----
  getInstructions: (userId: string) =>
    apiRequest<{ instructions: Instruction[] }>(endpoints.instructions, {
      query: { user_id: userId },
    }).then((r) => r.instructions ?? []),

  addInstruction: (input: { user_id: string; audience: 'team' | 'doctor'; body: string; lang?: string }) =>
    apiRequest<{ instruction: Instruction }>(endpoints.instructions, { method: 'POST', body: input }),
};
