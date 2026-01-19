# SkinByFizza Services API Documentation

Complete API reference for all services used in the SkinByFizza application.

## Overview

The app uses 7 main services that interact with Firebase:
1. **AuthService** - Authentication
2. **AppointmentService** - Appointment management
3. **ChatService** - Messaging
4. **FaqService** - FAQ/Knowledge base
5. **AiService** - AI Assistant logic
6. **NotificationService** - Notifications
7. **ProcedureService** - Procedures/Services

---

## AuthService

Handles user authentication, signup, signin, and role management.

### Methods

#### signUp(email, password)
Create a new user account.

**Parameters:**
- `email` (String): User's email address
- `password` (String): User's password

**Returns:** `Future<String?>` - "Success" or error message

**Example:**
```dart
final result = await authService.signUp(
  email: 'user@example.com',
  password: 'securePassword123',
);
```

---

#### signIn(email, password)
Sign in existing user.

**Parameters:**
- `email` (String): User's email
- `password` (String): User's password

**Returns:** `Future<String?>` - "Success" or error message

**Example:**
```dart
final result = await authService.signIn(
  email: 'user@example.com',
  password: 'securePassword123',
);
```

---

#### signInWithGoogle()
Sign in using Google credentials.

**Returns:** `Future<String?>` - "Success" or error message

**Example:**
```dart
final result = await authService.signInWithGoogle();
```

---

#### getUserRole(uid)
Get the role of a user.

**Parameters:**
- `uid` (String): User ID

**Returns:** `Future<String>` - "user" or "admin"

**Example:**
```dart
final role = await authService.getUserRole(uid);
if (role == 'admin') {
  // Show admin panel
}
```

---

#### setUserRole(uid, role)
Set/update user role (admin only).

**Parameters:**
- `uid` (String): User ID
- `role` (String): "user" or "admin"

**Returns:** `Future<void>`

---

#### signOut()
Sign out current user.

**Returns:** `Future<void>`

**Example:**
```dart
await authService.signOut();
```

---

### Properties

#### authStateChanges
Stream that emits user state changes.

**Type:** `Stream<User?>`

**Example:**
```dart
StreamBuilder<User?>(
  stream: authService.authStateChanges,
  builder: (context, snapshot) {
    if (snapshot.hasData) {
      // User is logged in
    }
  },
)
```

---

## AppointmentService

Manages user appointments and bookings.

### Methods

#### getUserAppointments()
Get appointments for current user.

**Returns:** `Stream<QuerySnapshot>` - Stream of user's appointments

**Example:**
```dart
StreamBuilder<QuerySnapshot>(
  stream: appointmentService.getUserAppointments(),
  builder: (context, snapshot) {
    final appointments = snapshot.data!.docs;
  },
)
```

---

#### getAllAppointments()
Get all appointments (admin only).

**Returns:** `Stream<QuerySnapshot>` - Stream of all appointments

---

#### createAppointment()
Create a new appointment.

**Parameters:**
- `procedureId` (String): Procedure ID
- `procedureName` (String): Procedure name
- `appointmentDate` (String): Date in YYYY-MM-DD format
- `appointmentTime` (String): Time in HH:mm format
- `doctorId` (String): Doctor/Admin ID (optional, defaults to 'admin_uid')

**Returns:** `Future<String>` - Appointment ID

**Example:**
```dart
final appointmentId = await appointmentService.createAppointment(
  procedureId: 'proc123',
  procedureName: 'HydraFacial',
  appointmentDate: '2026-02-15',
  appointmentTime: '14:30',
);
```

---

#### updateAppointmentStatus()
Update appointment status.

**Parameters:**
- `appointmentId` (String): Appointment ID
- `status` (String): "booked", "completed", "missed", or "cancelled"

**Returns:** `Future<void>`

**Example:**
```dart
await appointmentService.updateAppointmentStatus(
  appointmentId: 'apt123',
  status: 'completed',
);
```

---

#### getAppointment(appointmentId)
Get single appointment details.

**Parameters:**
- `appointmentId` (String): Appointment ID

**Returns:** `Future<AppointmentModel?>` - Appointment or null

---

#### getDoctorAppointments(doctorId)
Get appointments for specific doctor.

**Parameters:**
- `doctorId` (String): Doctor ID

**Returns:** `Stream<QuerySnapshot>` - Stream of doctor's appointments

---

## ChatService

Handles 1-to-1 messaging between users and doctors.

### Methods

#### getOrCreateConversation(userId, doctorId)
Get or create a conversation.

**Parameters:**
- `userId` (String): User ID
- `doctorId` (String): Doctor/Admin ID

**Returns:** `Future<String>` - Conversation ID

**Example:**
```dart
final conversationId = await chatService.getOrCreateConversation(
  userId: currentUserId,
  doctorId: 'admin_uid',
);
```

---

#### getMessages(conversationId)
Get messages stream for a conversation.

**Parameters:**
- `conversationId` (String): Conversation ID

**Returns:** `Stream<QuerySnapshot>` - Stream of messages

**Example:**
```dart
StreamBuilder<QuerySnapshot>(
  stream: chatService.getMessages(conversationId),
  builder: (context, snapshot) {
    final messages = snapshot.data!.docs;
  },
)
```

---

#### sendMessage()
Send a message in conversation.

**Parameters:**
- `conversationId` (String): Conversation ID
- `text` (String): Message text
- `senderId` (String): Sender ID
- `receiverId` (String): Receiver ID

**Returns:** `Future<void>`

**Example:**
```dart
await chatService.sendMessage(
  conversationId: 'conv123',
  text: 'Hello, how are you?',
  senderId: currentUserId,
  receiverId: 'admin_uid',
);
```

---

#### getUserConversations(userId)
Get all conversations for user.

**Parameters:**
- `userId` (String): User ID

**Returns:** `Stream<QuerySnapshot>` - Stream of conversations

---

#### getDoctorConversations(doctorId)
Get all conversations for doctor.

**Parameters:**
- `doctorId` (String): Doctor ID

**Returns:** `Stream<QuerySnapshot>` - Stream of conversations

---

#### sendAiMessage(message, isUser)
Send message to AI assistant.

**Parameters:**
- `message` (String): Message text
- `isUser` (Boolean): true if user message, false if bot response

**Returns:** `Future<bool>` - Success status

---

#### getAiMessages()
Get AI chat history for current user.

**Returns:** `Stream<QuerySnapshot>` - Stream of AI messages

---

## FaqService

Manages FAQ data and provides fallback knowledge base.

### Methods

#### fetchFaqs()
Fetch FAQs from Firestore.

**Returns:** `Future<void>`

**Example:**
```dart
final faqService = FaqService();
await faqService.fetchFaqs();
```

---

#### getAnswer(message)
Get FAQ answer based on user message.

**Parameters:**
- `message` (String): User's question/message

**Returns:** `Future<String>` - Response text

**Example:**
```dart
final response = await faqService.getAnswer('What are your hours?');
// Returns: "SkinByFizza is open Mon-Sat 11 AM-8 PM..."
```

---

#### seedInitialFaqs()
Populate FAQs in Firestore if empty.

**Returns:** `Future<void>`

---

## AiService

AI Assistant logic using FAQ keyword matching.

### Methods

#### loadFaqs()
Load FAQs into memory cache.

**Returns:** `Future<void>`

---

#### getResponse(userMessage)
Get AI response based on user input.

**Parameters:**
- `userMessage` (String): User's message

**Returns:** `Future<String>` - AI response

**Example:**
```dart
final response = await aiService.getResponse('How much for botox?');
```

---

#### getAllFaqs()
Get all FAQs.

**Returns:** `Future<List<FaqModel>>` - List of all FAQs

---

#### addFaq()
Add new FAQ (admin only).

**Parameters:**
- `keywords` (List<String>): Keywords for matching
- `answer` (String): FAQ answer
- `category` (String): FAQ category

**Returns:** `Future<String>` - FAQ ID

---

#### updateFaq()
Update existing FAQ.

**Parameters:**
- `faqId` (String): FAQ ID
- `keywords` (List<String>): Updated keywords
- `answer` (String): Updated answer
- `category` (String): Updated category

**Returns:** `Future<void>`

---

#### deleteFaq(faqId)
Delete FAQ.

**Parameters:**
- `faqId` (String): FAQ ID

**Returns:** `Future<void>`

---

## NotificationService

Handles local and Firestore notifications.

### Methods

#### initialize()
Initialize notification service (call in main.dart).

**Returns:** `Future<void>`

---

#### getUserNotifications(userId)
Get user's notifications stream.

**Parameters:**
- `userId` (String): User ID

**Returns:** `Stream<QuerySnapshot>` - Stream of notifications

---

#### createFirestoreNotification()
Create notification in Firestore.

**Parameters:**
- `userId` (String): Target user
- `title` (String): Notification title
- `message` (String): Notification message
- `type` (String): "appointment", "chat", or "system"
- `appointmentId` (String, optional): Related appointment

**Returns:** `Future<void>` (static method)

**Example:**
```dart
await NotificationService.createFirestoreNotification(
  userId: userId,
  title: 'Appointment Confirmed',
  message: 'Your appointment is scheduled for...',
  type: 'appointment',
  appointmentId: aptId,
);
```

---

#### markAsRead(notificationId)
Mark notification as read.

**Parameters:**
- `notificationId` (String): Notification ID

**Returns:** `Future<void>`

---

#### getUnreadCountStream(userId)
Get unread notification count stream.

**Parameters:**
- `userId` (String): User ID

**Returns:** `Stream<int>` - Stream of unread count

---

#### scheduleAppointmentReminders()
Schedule local reminders for appointment.

**Parameters:**
- `appointmentId` (String): Appointment ID
- `procedureName` (String): Procedure name
- `appointmentDate` (DateTime): Appointment date/time

**Returns:** `Future<void>`

**Schedules:**
- 24 hours before
- 2 hours before
- 1 hour after (completion reminder)

---

#### showInstantNotification()
Show immediate local notification.

**Parameters:**
- `title` (String): Notification title
- `body` (String): Notification body

**Returns:** `Future<void>`

---

#### startListeningForAppointments(userId)
Listen for appointment changes and show notifications.

**Parameters:**
- `userId` (String): User ID

**Returns:** `void` (starts listening)

---

#### startListeningForChat(userId)
Listen for new messages and show notifications.

**Parameters:**
- `userId` (String): User ID

**Returns:** `void` (starts listening)

---

## ProcedureService

Manages procedures/services data.

### Methods

#### getProcedures()
Get all procedures.

**Returns:** `Future<List<ProcedureModel>>` - List of all procedures

---

#### getProceduresStream()
Get procedures stream.

**Returns:** `Stream<QuerySnapshot>` - Real-time updates

---

#### getProcedure(procedureId)
Get single procedure.

**Parameters:**
- `procedureId` (String): Procedure ID

**Returns:** `Future<ProcedureModel?>` - Procedure or null

---

#### getProceduresByCategory(category)
Get procedures in specific category.

**Parameters:**
- `category` (String): Category name (e.g., "Facial", "Laser")

**Returns:** `Future<List<ProcedureModel>>` - Filtered procedures

---

#### addProcedure(procedure)
Add new procedure (admin only).

**Parameters:**
- `procedure` (ProcedureModel): Procedure data

**Returns:** `Future<String>` - Procedure ID

---

#### updateProcedure()
Update procedure (admin only).

**Parameters:**
- `procedureId` (String): Procedure ID
- `procedure` (ProcedureModel): Updated data

**Returns:** `Future<void>`

---

#### deleteProcedure(procedureId)
Delete procedure (admin only).

**Parameters:**
- `procedureId` (String): Procedure ID

**Returns:** `Future<void>`

---

## Error Handling

All services throw exceptions for errors. Wrap calls in try-catch:

```dart
try {
  final appointment = await appointmentService.createAppointment(...);
} on FirebaseAuthException catch (e) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Auth error: ${e.message}')),
  );
} catch (e) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Error: $e')),
  );
}
```

## Firestore Queries Used

The app uses these Spark Plan-friendly queries:

```dart
// Appointments by user
appointments.where('userId', isEqualTo: userId)
           .orderBy('createdAt', descending: true)

// Notifications by user
notifications.where('userId', isEqualTo: userId)
            .orderBy('createdAt', descending: true)

// Conversations by user
conversations.where('userId', isEqualTo: userId)
            .orderBy('updatedAt', descending: true)

// Procedures (simple read)
procedures.get()

// FAQs (simple read)
faqs.get()
```

No complex composite indexes required!

---

## Best Practices

1. **Stream Management**: Dispose of listeners when screens close
2. **Error Handling**: Always handle potential Firebase exceptions
3. **Caching**: FAQ and AI services cache data locally
4. **Timestamps**: Always use `Timestamp.now()` or `FieldValue.serverTimestamp()`
5. **Pagination**: For large lists, implement pagination using `limit()` and `startAfter()`

---

**Last Updated:** January 16, 2026
**API Version:** 1.0.0
