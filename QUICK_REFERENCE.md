# SkinByFizza - Developer Quick Reference

Fast lookup guide for common tasks and implementation details.

## 🔥 Quick Links

- **Setup:** Start with [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
- **Deploy:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **API Docs:** Check [SERVICES_API.md](SERVICES_API.md)
- **Status:** [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)

## 🎯 Common Tasks

### Add a New Procedure
```dart
// In procedure_service.dart or admin screen
final procedureId = await procedureService.addProcedure(
  ProcedureModel(
    id: '',
    title: 'New Procedure',
    description: 'Description here',
    price: 5000,
    category: 'Category',
  ),
);
```

### Create Admin User
1. Create user in Firebase Auth
2. In Firestore, set:
```json
{
  "role": "admin",
  "displayName": "Admin Name",
  "status": "Active"
}
```

### Add FAQ Entry
```dart
await aiService.addFaq(
  keywords: ['keyword1', 'keyword2'],
  answer: 'The answer to the question',
  category: 'services',
);
```

### Send Appointment Notification
```dart
await NotificationService.createFirestoreNotification(
  userId: userId,
  title: 'Appointment Booked',
  message: 'Your appointment is scheduled',
  type: 'appointment',
  appointmentId: aptId,
);
```

### Get Current User
```dart
final user = FirebaseAuth.instance.currentUser;
final uid = user?.uid;
```

### Check if User is Admin
```dart
final role = await authService.getUserRole(uid);
final isAdmin = role == 'admin';
```

## 🏗️ Architecture

```
UI (Screens) 
   ↓
Services (Business Logic)
   ↓
Firebase (Firestore, Auth)
```

**Services never call other services directly**
- Each service is independent
- UI passes data between services
- Services only access Firebase

## 🔄 Data Flow Examples

### Creating Appointment
```
BookAppointmentScreen
  → appointmentService.createAppointment()
    → Firestore: Add to 'appointments'
    → NotificationService.createFirestoreNotification()
      → Firestore: Add to 'notifications'
```

### Sending Message
```
ChatScreen
  → chatService.sendMessage()
    → Firestore: Add to 'conversations/{id}/messages'
    → Update 'conversations/{id}' lastMessage
    → Create notification in 'notifications'
```

### AI Chat
```
AiChatScreen
  → Get user message
  → chatService.sendAiMessage(message, true)
    → Save to 'ai_chat_messages'
  → aiService.getResponse(message)
    → Match against 'faqs' keywords
    → Return answer
  → chatService.sendAiMessage(response, false)
    → Save to 'ai_chat_messages'
  → Display in UI
```

## 📊 Firestore Collections Quick Ref

| Collection | Documents | Key Fields |
|------------|-----------|-----------|
| users | {uid} | email, role, displayName, createdAt |
| procedures | {procId} | title, price, category, description |
| appointments | {aptId} | userId, status, appointmentDate, appointmentTime |
| conversations | {convId} | userId, doctorId, lastMessage, updatedAt |
| conversations/{id}/messages | {msgId} | senderId, text, createdAt |
| notifications | {notifId} | userId, type, isRead, createdAt |
| faqs | {faqId} | keywords, answer, category |
| ai_chat_messages | {msgId} | userId, message, isUser, timestamp |

## 🔐 Security Rules Summary

```
✅ Can Read/Write Own Data
❌ Can't Access Others' Data
✅ Admin Can Do Anything
❌ Public Can Only Read Procedures & FAQs
```

## 🎨 Colors & Theme

```dart
AppColors.primary          // #D4AF37 (Gold) - Main theme
AppColors.secondary        // #81C784 (Green) - Health/Medical
AppColors.accent           // #F06292 (Pink) - Beauty/Shop
AppColors.background       // #FAFAFA (Light Grey)
AppColors.textPrimary      // #212121 (Dark)
AppColors.textSecondary    // #757575 (Grey)
```

## 📱 Screen Navigation

```
WelcomeScreen
  ├─ SignInScreen
  ├─ SignUpScreen
  └─ PasswordRecoveryScreen

HomeScreen (User)
  ├─ Dashboard
  ├─ ProceduresListScreen
  ├─ AiChatScreen
  ├─ AppointmentsListScreen
  ├─ NotificationsScreen
  └─ ProfileScreen

AdminPanelScreen (Admin)
  ├─ ManageUsersScreen
  ├─ ManageProceduresScreen
  ├─ ManageAppointmentsScreen
  ├─ AdminChatManagerScreen
  └─ ManageAboutUsScreen
```

## 🚨 Error Handling Pattern

```dart
try {
  // Do something with service
  await service.doSomething();
} on FirebaseException catch (e) {
  print('Firebase error: ${e.code}');
  // Show user-friendly message
} catch (e) {
  print('Error: $e');
}
```

## ⚡ Performance Tips

1. **Cache FAQs** - FaqService does this automatically
2. **Use Streams** - Real-time sync with StreamBuilder
3. **Limit Queries** - Use `.limit(N)` for pagination
4. **Order Queries** - Most recent first with `.orderBy(..., descending: true)`
5. **Index Queries** - Spark Plan uses default indexes

## 📲 Notification Types

| Type | Trigger | User Sees |
|------|---------|-----------|
| appointment | Booking/Status change | Local notification + Firestore |
| chat | New message | Local notification + Firestore |
| system | Admin sends | Firestore only |

## 🧪 Testing Credentials

### Test User
- Email: `user@test.com`
- Password: `Test123456`
- Role: `user`

### Test Admin
- Email: `admin@test.com`
- Password: `Admin123456`
- Role: `admin`

(Create these in Firebase Auth and Firestore)

## 🔍 Debugging

### Check User Auth
```dart
final user = FirebaseAuth.instance.currentUser;
if (user != null) {
  print('Logged in: ${user.email}');
} else {
  print('Not logged in');
}
```

### Check Firestore Doc
```dart
final doc = await FirebaseFirestore.instance
  .collection('users')
  .doc(uid)
  .get();
print(doc.data());
```

### Enable Firebase Logging
```dart
// In main.dart before Firebase.initializeApp()
FirebaseFirestore.instance.settings = Settings(
  persistenceEnabled: true,
  cacheSizeBytes: 40 * 1024 * 1024,
);
```

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| firebase_core | ^2.27.0 | Firebase base |
| firebase_auth | ^4.17.8 | Authentication |
| cloud_firestore | ^4.15.8 | Database |
| firebase_storage | ^11.6.9 | File storage |
| provider | ^6.1.2 | State management |
| google_sign_in | ^6.2.1 | Google auth |
| flutter_local_notifications | ^17.0.0 | Local notifications |

## 🆘 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Permission Denied | Rules not deployed | `firebase deploy --only firestore:rules` |
| Index Not Found | Complex query | Use simple queries or add index |
| Auth Error | Invalid credentials | Check email/password format |
| Connection Error | No internet | Check network connectivity |
| Notification Not Showing | Permission not granted | Request permission in app |

## 🔗 Firebase Console Links

After creating project:
- **Firestore:** console.firebase.google.com → Firestore Database
- **Auth:** console.firebase.google.com → Authentication
- **Rules:** console.firebase.google.com → Firestore → Rules
- **Analytics:** console.firebase.google.com → Analytics

## 📋 Pre-Deployment Checklist

- [ ] All Firebase configs added (google-services.json, GoogleService-Info.plist)
- [ ] Firestore rules deployed
- [ ] Admin user created with role='admin'
- [ ] Sample procedures added
- [ ] FAQs populated
- [ ] Contact info updated in FAQs
- [ ] App version updated in pubspec.yaml
- [ ] No debug prints in production code
- [ ] Icon and splash screen configured
- [ ] Privacy policy URL added
- [ ] Build successful: `flutter build apk` and `flutter build ios`

## 🎯 Key Classes

| Class | File | Purpose |
|-------|------|---------|
| AuthService | services/auth_service.dart | User authentication |
| AppointmentService | services/appointment_service.dart | Appointments |
| ChatService | services/chat_service.dart | Messaging |
| FaqService | services/faq_service.dart | FAQ data |
| AiService | services/ai_service.dart | AI responses |
| NotificationService | services/notification_service.dart | Notifications |
| ProcedureService | services/procedure_service.dart | Procedures |

## 🚀 Launch Command

```bash
flutter run -v  # Verbose mode for debugging
```

## 📞 Support

- Stuck? Check [SERVICES_API.md](SERVICES_API.md)
- Firebase issue? See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
- Deploy issue? Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- General? Read [README.md](README.md)

---

**Version:** 1.0.0  
**Last Updated:** January 16, 2026  
**Status:** Ready for Development ✅
