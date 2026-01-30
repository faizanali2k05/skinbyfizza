# Firestore Collection Structure

## Complete Data Schema for SkinByFizza

This document shows the exact structure of all Firestore collections with example documents.

---

## 1. Users Collection

**Path**: `users/{uid}`

**Purpose**: Store user profiles and authentication roles

### Example Document (User)
```json
{
  "uid": "user_12345",
  "name": "Ahmed Khan",
  "email": "ahmed@example.com",
  "phone": "03001234567",
  "role": "user",
  "photoUrl": "https://storage.../profile.jpg",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Example Document (Admin)
```json
{
  "uid": "admin_12345",
  "name": "Dr. Fizza",
  "email": "doctor@skinbyfizza.com",
  "phone": "02135345678",
  "role": "admin",
  "photoUrl": "https://storage.../doctor.jpg",
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-15T14:00:00Z"
}
```

### Field Types
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| uid | string | ✓ | Document ID = Firebase Auth UID |
| name | string | ✓ | User's full name |
| email | string | ✓ | Email address (must be unique) |
| phone | string | ✓ | Phone number |
| role | string | ✓ | Either 'user' or 'admin' |
| photoUrl | string | ✗ | Profile photo URL |
| createdAt | timestamp | ✓ | Account creation time |
| updatedAt | timestamp | ✓ | Last profile update |

---

## 2. Procedures Collection

**Path**: `procedures/{procedureId}`

**Purpose**: Store available beauty/dermatology procedures

### Example Document 1
```json
{
  "id": "proc_001",
  "name": "HydraFacial",
  "description": "Advanced hydration facial treatment using water and vortex technology",
  "duration": 60,
  "price": 5000,
  "imageUrl": "https://storage.../hydrafacial.jpg",
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-10T08:00:00Z"
}
```

### Example Document 2
```json
{
  "id": "proc_002",
  "name": "Laser Hair Removal",
  "description": "Permanent hair reduction using diode laser technology",
  "duration": 45,
  "price": 3500,
  "imageUrl": "https://storage.../laser.jpg",
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-10T08:00:00Z"
}
```

### Field Types
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | ✓ | Unique procedure ID (set in Firestore) |
| name | string | ✓ | Procedure name (e.g., "HydraFacial") |
| description | string | ✓ | Detailed description |
| duration | number | ✓ | Duration in minutes |
| price | number | ✓ | Price in PKR |
| imageUrl | string | ✗ | Procedure image URL |
| createdAt | timestamp | ✓ | Creation time |
| updatedAt | timestamp | ✓ | Last update time |

---

## 3. Appointments Collection

**Path**: `appointments/{appointmentId}`

**Purpose**: Store appointment bookings

### Example Document 1 (Booked)
```json
{
  "id": "apt_12345",
  "userId": "user_12345",
  "procedureId": "proc_001",
  "procedureName": "HydraFacial",
  "appointmentDate": "2024-02-15",
  "appointmentTime": "14:30",
  "status": "booked",
  "notes": "Please arrive 10 minutes early. Have sensitive skin.",
  "adminNotes": null,
  "createdAt": "2024-02-01T10:00:00Z",
  "updatedAt": "2024-02-01T10:00:00Z"
}
```

### Example Document 2 (Confirmed)
```json
{
  "id": "apt_12346",
  "userId": "user_12345",
  "procedureId": "proc_002",
  "procedureName": "Laser Hair Removal",
  "appointmentDate": "2024-02-16",
  "appointmentTime": "11:00",
  "status": "confirmed",
  "notes": "First time customer",
  "adminNotes": "Patient confirmed. Bring ID.",
  "createdAt": "2024-02-01T11:00:00Z",
  "updatedAt": "2024-02-02T09:30:00Z"
}
```

### Field Types
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | ✓ | Document ID = appointmentId |
| userId | string | ✓ | Booking user's UID |
| procedureId | string | ✓ | Procedure being booked |
| procedureName | string | ✓ | Procedure name (cached) |
| appointmentDate | string | ✓ | Date in YYYY-MM-DD format |
| appointmentTime | string | ✓ | Time in HH:mm format (24-hour) |
| status | string | ✓ | One of: 'booked', 'confirmed', 'completed', 'cancelled' |
| notes | string | ✗ | User's special requests |
| adminNotes | string | ✗ | Admin/doctor notes |
| createdAt | timestamp | ✓ | When booked |
| updatedAt | timestamp | ✓ | Last status change |

### Query Examples
```dart
// Get user's appointments
where('userId', isEqualTo: 'user_12345')
  .orderBy('createdAt', descending: true)

// Get appointments by status
where('status', isEqualTo: 'booked')
  .orderBy('createdAt', descending: true)

// Get upcoming appointments
where('appointmentDate', isGreaterThan: '2024-02-15')
```

---

## 4. Conversations Collection

**Path**: `conversations/{conversationId}`

**Purpose**: Store user-admin conversation threads

### Example Document
```json
{
  "id": "conv_001",
  "userId": "user_12345",
  "adminId": "admin_12345",
  "lastMessage": "Thank you! See you on Feb 15th",
  "lastSenderId": "user_12345",
  "createdAt": "2024-02-01T10:00:00Z",
  "updatedAt": "2024-02-01T15:30:00Z"
}
```

### Field Types
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | ✓ | Document ID = conversationId |
| userId | string | ✓ | Customer's UID |
| adminId | string | ✓ | Doctor/admin's UID |
| lastMessage | string | ✗ | Preview of last message |
| lastSenderId | string | ✗ | Who sent the last message |
| createdAt | timestamp | ✓ | Conversation start |
| updatedAt | timestamp | ✓ | Last message time |

### Subcollection: Messages

**Path**: `conversations/{conversationId}/messages/{messageId}`

```json
{
  "id": "msg_001",
  "senderId": "user_12345",
  "senderName": "Ahmed Khan",
  "senderRole": "user",
  "text": "I'd like to book an appointment for HydraFacial",
  "createdAt": "2024-02-01T10:00:00Z"
}
```

Message Subcollection Fields:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | ✓ | Document ID = messageId |
| senderId | string | ✓ | Sender's UID |
| senderName | string | ✓ | Sender's name (for display) |
| senderRole | string | ✓ | Either 'user' or 'admin' |
| text | string | ✓ | Message content |
| createdAt | timestamp | ✓ | Message timestamp |

### Query Examples
```dart
// Get user's conversations
where('userId', isEqualTo: 'user_12345')
  .orderBy('updatedAt', descending: true)

// Get admin's conversations
where('adminId', isEqualTo: 'admin_12345')
  .orderBy('updatedAt', descending: true)

// Get messages in conversation (ordered oldest first)
collection('conversations').doc(conversationId)
  .collection('messages')
  .orderBy('createdAt', descending: false)
```

---

## 5. Notifications Collection

**Path**: `notifications/{notificationId}`

**Purpose**: Store real-time notifications for users

### Example Document 1 (Appointment)
```json
{
  "id": "notif_001",
  "userId": "user_12345",
  "title": "Appointment Booked",
  "message": "Your HydraFacial appointment has been scheduled for Feb 15, 2:30 PM",
  "type": "appointment",
  "appointmentId": "apt_12345",
  "conversationId": null,
  "isRead": false,
  "createdAt": "2024-02-01T10:00:00Z"
}
```

### Example Document 2 (Message)
```json
{
  "id": "notif_002",
  "userId": "user_12345",
  "title": "New Message from Doctor",
  "message": "Your appointment is confirmed. Please arrive 15 minutes early.",
  "type": "message",
  "appointmentId": null,
  "conversationId": "conv_001",
  "isRead": false,
  "createdAt": "2024-02-02T09:30:00Z"
}
```

### Example Document 3 (Status Update)
```json
{
  "id": "notif_003",
  "userId": "user_12345",
  "title": "Appointment Confirmed",
  "message": "Your appointment status has been updated to confirmed",
  "type": "status_update",
  "appointmentId": "apt_12345",
  "conversationId": null,
  "isRead": true,
  "createdAt": "2024-02-02T09:00:00Z"
}
```

### Field Types
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | ✓ | Document ID = notificationId |
| userId | string | ✓ | Recipient's UID |
| title | string | ✓ | Notification title |
| message | string | ✓ | Notification body |
| type | string | ✓ | One of: 'appointment', 'message', 'status_update' |
| appointmentId | string | ✗ | Related appointment (if type='appointment' or 'status_update') |
| conversationId | string | ✗ | Related conversation (if type='message') |
| isRead | boolean | ✓ | Whether user has read it |
| createdAt | timestamp | ✓ | When notification created |

### Query Examples
```dart
// Get user's notifications
where('userId', isEqualTo: 'user_12345')
  .orderBy('createdAt', descending: true)

// Get unread count
where('userId', isEqualTo: 'user_12345')
  .where('isRead', isEqualTo: false)
```

---

## 6. FAQs Collection

**Path**: `faqs/{faqId}`

**Purpose**: Store FAQ entries for keyword-based AI chat

### Example Document 1
```json
{
  "id": "faq_001",
  "question": "What are your operating hours?",
  "answer": "We are open Monday to Saturday from 11:00 AM to 8:00 PM. We are closed on Sundays.",
  "keywords": ["hours", "open", "close", "time", "schedule", "when"],
  "category": "info",
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-10T08:00:00Z"
}
```

### Example Document 2
```json
{
  "id": "faq_002",
  "question": "How much does a consultation cost?",
  "answer": "Consultation fee is PKR 3,000. Procedure prices vary from PKR 2,500 to PKR 15,000 depending on the treatment.",
  "keywords": ["price", "cost", "charges", "fee", "how much", "consultation"],
  "category": "services",
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-10T08:00:00Z"
}
```

### Example Document 3
```json
{
  "id": "faq_003",
  "question": "What treatments do you offer?",
  "answer": "We offer HydraFacial, Laser Hair Removal, PRP, Chemical Peels, Acne Scar Treatment, Skin Whitening Drips, and Botox/Fillers.",
  "keywords": ["services", "treatments", "procedures", "laser", "acne", "whitening", "botox"],
  "category": "services",
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-10T08:00:00Z"
}
```

### Field Types
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | ✓ | Document ID = faqId |
| question | string | ✓ | FAQ question |
| answer | string | ✓ | FAQ answer |
| keywords | array | ✓ | Array of keywords for matching |
| category | string | ✓ | Category (e.g., 'info', 'services', 'procedures') |
| createdAt | timestamp | ✓ | When created |
| updatedAt | timestamp | ✓ | Last updated |

### Matching Algorithm
```
1. User asks: "What time do you open?"
2. Normalize: "what time do you open"
3. Score each FAQ:
   - faq_001: keywords match ["time", "open"] = 2 words = 2 points
   - faq_002: no keyword match = 0 points
   - faq_003: no keyword match = 0 points
4. Return faq_001 answer
```

---

## Collection Relationships

```
users (users can be)
  ├── Creator of appointments
  ├── Participant in conversations
  ├── Recipient of notifications
  └── Creator of FAQ questions (not stored)

procedures
  └── Referenced in appointments

appointments
  ├── Created by users
  └── Trigger notifications

conversations
  ├── Between user and admin
  └── Contains messages subcollection
       └── Each message triggers notification

notifications
  ├── Created for users
  ├── References appointments or conversations
  └── Marked as read by users

faqs
  └── Queried by users for answers
```

---

## Firestore Limits & Optimization

### Document Size
- Max 1 MB per document
- Messages stored in subcollections (not in conversation parent)

### Collection Size
- Unlimited documents per collection
- But index creation slower with large collections

### Reads/Writes (Spark Plan)
- 50,000 reads/day
- 20,000 writes/day
- Real-time streams = efficient (1 read per change, not per client)

### Indexing
- 5 composite indexes required (see Security Rules)
- Queries with where + orderBy require indexes

---

## Example Document Creation

### Creating a User (from AuthService)
```dart
final userDoc = UserModel(
  uid: firebaseUser.uid,
  name: 'Ahmed Khan',
  email: 'ahmed@example.com',
  phone: '03001234567',
  role: 'user',
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

await FirebaseFirestore.instance
  .collection('users')
  .doc(firebaseUser.uid)
  .set(userDoc.toMap());
```

### Creating an Appointment (from AppointmentService)
```dart
final appointment = AppointmentModel(
  id: '',
  userId: 'user_12345',
  procedureId: 'proc_001',
  procedureName: 'HydraFacial',
  appointmentDate: '2024-02-15',
  appointmentTime: '14:30',
  status: 'booked',
  notes: 'Please arrive 10 minutes early',
  createdAt: DateTime.now(),
  updatedAt: DateTime.now(),
);

final docRef = await FirebaseFirestore.instance
  .collection('appointments')
  .add(appointment.toMap());
  
// Auto-create notification
await FirebaseFirestore.instance
  .collection('notifications')
  .add(NotificationModel(
    userId: 'user_12345',
    title: 'Appointment Booked',
    message: 'HydraFacial scheduled for Feb 15, 2:30 PM',
    type: 'appointment',
    appointmentId: docRef.id,
  ).toMap());
```

---

## Data Flow Diagram

```
User Signs Up
  ↓
Creates auth user (Firebase Auth)
  ↓
Creates user document (Firestore users/{uid})
  ↓
Auto-sets role = 'user'
  ↓
Sign In
  ↓
Fetches user document to get role
  ↓
Routes to Home (if user) or Admin Panel (if admin)

User Books Appointment
  ↓
Creates appointment document (appointments/{id})
  ↓
Auto-creates notification (notifications/{id})
  ↓
Real-time updates for user & admin

User Sends Chat Message
  ↓
Creates message (conversations/{id}/messages/{id})
  ↓
Updates conversation lastMessage
  ↓
Auto-creates notification
  ↓
Recipient sees notification in real-time

Admin Updates Appointment Status
  ↓
Updates appointment status field
  ↓
Auto-creates status_update notification
  ↓
User sees notification & appointment updates in real-time
```

---

## Firestore Console Access

### View Collection Data
1. Firebase Console → Firestore Database
2. Click collection name (e.g., "users")
3. View all documents and subcollections

### Create Test Documents
1. Click "Add Document" button
2. Set document ID (or auto-generate)
3. Add fields with proper types
4. Save

### Delete Collection
1. Right-click collection → Delete collection
2. Confirm deletion
3. Note: Usually only dev collections

---

**Last Updated**: February 2024  
**Status**: Complete & Production-Ready
