# SkinByFizza - Flutter Application

A complete Flutter application for SkinByFizza clinic with Firebase Authentication, Cloud Firestore, Admin Panel, Appointments, Chat, and AI FAQ Assistant.

## 🌟 Features Implemented

### 🔐 Authentication
- Email & password signup/login
- Google Sign-In integration
- User roles: `user` and `admin`
- Admin redirects to Admin Panel
- Regular users redirect to Home Dashboard

### 📊 Firestore Collections
- **users** - User profiles and roles
- **procedures** - Service/treatment information
- **appointments** - Appointment bookings and management
- **conversations** - 1-to-1 doctor-user chats (with nested messages)
- **notifications** - User notifications for appointments and messages
- **faqs** - FAQ entries for AI Assistant
- **ai_chat_messages** - Chat history with AI Assistant

### 💬 AI FAQ Chat (No External APIs)
- Fetches data from FAQs collection
- Keyword-based matching
- Formal clinic responses
- Graceful no-match handling
- Spark Plan friendly (no API costs)

### 💬 Doctor Chat
- Simple 1-to-1 text messaging
- No attachments or read receipts
- Same UI for admin & users
- Real-time message updates
- Conversation management

### 📅 Appointments
- Users can book appointments
- Admin can manage all appointments
- Status tracking: `booked`, `completed`, `missed`, `cancelled`
- Notification creation on status changes
- Appointment reminders (local notifications)

### 🔔 Notifications
- Created on: appointment booking, cancellation, completion, new messages
- Firestore query: `where(userId == currentUser) orderBy(createdAt, descending)`
- Local device notifications with scheduling
- Push notification support

### 🎨 UI Features
- Clean, minimal design
- Gold theme (#D4AF37) for user messages
- Light theme for AI & doctor messages
- Proper loading states
- No stuck loaders
- Material Design 3

### 🔒 Security & Performance
- Firebase Spark Plan compatible
- Secure Firestore rules
- No Cloud Functions required
- No paid APIs
- Index-friendly queries
- Offline support through caching

## 📋 Project Structure

```
lib/
├── main.dart                 # App entry point
├── app.dart                  # App configuration
├── models/                   # Data models
│   ├── user_model.dart
│   ├── appointment_model.dart
│   ├── chat_message_model.dart
│   ├── chat_conversation_model.dart
│   ├── notification_model.dart
│   ├── faq_model.dart
│   └── procedure_model.dart
├── services/                 # Business logic
│   ├── auth_service.dart
│   ├── appointment_service.dart
│   ├── chat_service.dart
│   ├── faq_service.dart
│   ├── ai_service.dart
│   ├── notification_service.dart
│   └── procedure_service.dart
├── screens/                  # UI screens
│   ├── auth/                 # Login, signup, password recovery
│   ├── home/                 # Dashboard, appointments, notifications
│   ├── appointments/         # Book, list, detail, reschedule
│   ├── chat/                 # AI chat and doctor chat
│   ├── procedures/           # Procedures listing
│   ├── profile/              # User profile
│   └── admin/                # Admin management screens
├── widgets/                  # Reusable components
├── constants/                # Colors, strings, styles
├── routes/                   # Navigation routes
├── config/                   # Configuration files
└── assets/                   # Images and assets
```

## 🚀 Getting Started

### Prerequisites
- Flutter SDK: >=3.10.1
- Firebase project set up
- Android & iOS development environment

### Installation

1. **Clone the repository**
   ```bash
   cd skinbyfizza
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Configure Firebase**
   - Copy your Firebase credentials to `lib/firebase_options.dart`
   - Update Android and iOS configuration files

4. **Run the app**
   ```bash
   flutter run
   ```

## 🔧 Firebase Setup

### 1. Create Collections in Firestore

The app will automatically populate sample data on first run. Manual collections to create:

```
faqs/              # FAQ entries for AI Assistant
procedures/        # Procedures/services
users/             # User profiles
appointments/      # Appointments
notifications/     # Notifications
conversations/     # Conversations (with nested messages subcollection)
ai_chat_messages/  # AI chat history
```

### 2. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

The rules file (`firestore.rules`) is included and implements:
- User-level security
- Admin access control
- Conversation participant verification
- No complex indexes (Spark Plan compatible)

### 3. Enable Authentication Methods
- Email/Password
- Google Sign-In

### 4. Create Test Admin Account

Add a user with role `admin` to test the admin panel:

```bash
# Create user in Firebase Auth, then set role in Firestore:
db.collection('users').doc(uid).set({
  'email': 'admin@example.com',
  'displayName': 'Admin User',
  'role': 'admin',
  'createdAt': Timestamp.now(),
  'status': 'Active'
})
```

## 📱 App Workflows

### User Signup/Login
1. User enters email and password
2. Firebase Auth creates account
3. User document created in Firestore
4. User redirected to Home Dashboard

### Booking Appointment
1. User selects procedure and date/time
2. Appointment created in Firestore
3. Notification generated
4. Local reminder scheduled

### Admin Managing Appointments
1. Admin sees all appointments in dashboard
2. Admin changes appointment status
3. User receives notification
4. System schedules local notification

### AI Chat
1. User sends message
2. Message saved to Firestore
3. FAQ service matches keywords
4. Response displayed in chat

### Doctor Chat
1. User initiates conversation with doctor
2. 1-to-1 chat created
3. Messages stored in Firestore
4. Recipient gets notification

## 🧪 Testing

Run tests:
```bash
flutter test
```

## 📦 Build for Production

### Android
```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## 🛡️ Security Considerations

1. **Firestore Rules** - All requests validated
2. **No Passwords Stored** - Firebase Auth handles authentication
3. **User Isolation** - Users only see their data
4. **Admin Verification** - Admin role checked in security rules
5. **Timestamps** - Server-generated to prevent tampering

## 📊 Firestore Index Strategy (Spark Plan Friendly)

The app uses simple, indexed-by-default queries:

- `appointments where(userId) orderBy(createdAt)` ✅
- `notifications where(userId) orderBy(createdAt)` ✅
- `conversations where(userId)` ✅
- `faqs` simple reads ✅

No complex composite indexes required!

## 🐛 Troubleshooting

### "Permission Denied" Errors
- Check Firestore rules are deployed
- Verify user role is set correctly
- Clear app cache and rebuild

### "Index Not Found" Errors
- This shouldn't happen with Spark Plan rules
- If it does, check firestore.rules is deployed correctly

### Notifications Not Showing
- Check platform-specific permissions are granted
- Verify notification service is initialized in main.dart

### Chat Messages Not Syncing
- Ensure conversations subcollection is created
- Check Firebase connection

## 📞 Support

For issues or questions, check the Flutter and Firebase documentation:
- [Flutter Docs](https://docs.flutter.dev)
- [Firebase Docs](https://firebase.google.com/docs)

## 📄 License

This project is proprietary and confidential.

---

**Version:** 1.0.0  
**Updated:** January 2026  
**Status:** Production Ready ✅
## Firestore Notes ⚠️

- Some Firestore queries that combine `where(...)` with `orderBy(...)` may require a composite index in the Firebase Console. If you see a runtime error containing "requires an index" or a direct console link, create the index and wait for it to build.
- Example: the `notifications` query filters by `userId` and orders by `createdAt` — create the recommended composite index to avoid `failed-precondition` errors.
- If you don't have access to the Firebase CLI, you can open the Firestore Console and paste the link shown in the runtime error to create the index.

