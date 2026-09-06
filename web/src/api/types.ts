export type Role = 'user' | 'manager' | 'doctor';
export type CustomerType = 'regular' | 'vip';

export type User = {
  id: string;
  full_name: string;
  email: string | null;
  phone_e164: string;
  role: Role;
  customer_type: CustomerType;
  status: 'active' | 'inactive';
  interest_rating?: number | null;
  city?: string | null;
  photo_url?: string | null;
  created_at?: string;
};

export type AuthResponse = {
  token: string;
  refresh: string;
  user: User;
};

export type Procedure = {
  id: string;
  title: string;
  description: string;
  category: string;
  duration?: string;
  sessions?: number;
  visits_per_session?: number;
  /** Time between sessions/visits — no price field by design. */
  session_gap?: string;
  key_features?: string[];
  image_url?: string | null;
};

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type Appointment = {
  id: string;
  user_id: string;
  procedure_id: string;
  procedure_title?: string;
  full_name?: string;
  scheduled_at: string;
  original_scheduled_at?: string | null;
  status: AppointmentStatus;
  city?: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  type: 'text' | 'image' | 'audio' | 'file';
  media_url?: string | null;
  tagged_to_doctor?: boolean;
  is_read?: boolean;
  created_at: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

export type Thread = {
  id: string;
  user_id: string;
  platform: 'app' | 'whatsapp';
  triage: 'general' | 'primary';
  last_message: string | null;
  last_sender_id: string | null;
  unread_count: number;
  updated_at: string;
  full_name: string;
  customer_type: CustomerType;
  phone_e164: string;
  photo_url?: string | null;
};

export type Prescription = {
  id: string;
  user_id: string;
  item_name: string;
  price?: number | null;
  notes?: string | null;
  created_at: string;
};

export type Instruction = {
  id: string;
  audience: 'team' | 'doctor';
  body: string;
  lang?: string;
  created_at: string;
};

export type AboutResponse = {
  about: {
    description?: string;
    email?: string;
    phone?: string;
    instagram?: string;
    facebook?: string;
  } | null;
  locations: {
    id: string;
    name: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
    map_url?: string;
  }[];
};

/** Consultation intake captured while booking (POST /appointments/book). */
export type ConsultationInput = {
  full_name?: string;
  date_of_birth?: string;
  address?: string;
  phone?: string;
  email?: string;
  referred_by?: string;
  main_goal?: string;
  form?: Record<string, unknown>;
  signature?: string;
  agreed?: boolean;
};
