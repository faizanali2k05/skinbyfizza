# Quick Reference - SimpleChatScreen & SimpleAdminScreen

## SimpleChatScreen (User Chat Interface)

### Location
`lib/screens/chat/simple_chat_screen.dart`

### Component Hierarchy
```
SimpleChatScreen (StatefulWidget)
├── AppBar
│   └── SegmentedButton (AI / Doctor toggle)
├── StreamBuilder (Chat messages)
│   └── Column (Message list)
│       └── ChatBubble (for each message)
└── TextField + Send Button
```

### Key Methods
- `_initializeAI()` - Loads FAQ database
- `_initializeDoctorChat()` - Creates/gets conversation with doctor
- `_sendMessage()` - Handles message sending for both modes

### State Variables
- `_isAiMode: bool` - Current chat mode
- `_conversationId: String?` - Doctor chat conversation ID
- `_isLoading: bool` - Loading state during message send
- `_initError: bool` - Initialization error flag

### Usage Flow
1. Screen initializes both AI and Doctor chat in `initState()`
2. User sees AI mode by default
3. Toggle button switches between modes
4. Messages are fetched and displayed via StreamBuilder
5. Messages sent differently based on mode

---

## SimpleAdminScreen (Admin Dashboard)

### Location
`lib/screens/admin/simple_admin_screen.dart`

### Component Hierarchy
```
SimpleAdminScreen (StatefulWidget)
├── AppBar (with logout button)
├── SingleChildScrollView
│   └── Column
│       ├── Dashboard Stats (Cards)
│       ├── Manage Appointments Section
│       │   └── StreamBuilder
│       │       └── ListView (Appointment list)
│       ├── Manage Users Section
│       │   └── StreamBuilder
│       │       └── ListView (User list)
│       └── Populate Data Button
```

### Key Methods
- `_buildStatCard()` - Creates dashboard stat cards
- `_buildAppointmentsList()` - Builds appointments StreamBuilder
- `_buildUsersList()` - Builds users StreamBuilder
- `_updateAppointmentStatus()` - Changes appointment status

### Firestore Integration
- Reads from `appointments` collection
- Reads from `users` collection
- Writes status updates to `appointments` collection
- Seeds `procedures` and `faqs` collections via `populateFirestore()`

### Features
1. **Dashboard Overview** - Shows stats cards for appointments and users
2. **Appointment Management** - View all appointments with status dropdown
3. **User Management** - View registered users and their details
4. **Data Seeding** - Button to populate Firestore with sample data

---

## Routing Configuration

### Routes Affected (in app_routes.dart)
```dart
aiChat: (context) => const SimpleChatScreen(),
adminPanel: (context) => const SimpleAdminScreen(),
```

### Navigation Flow
```
WelcomeScreen
    ↓
AuthService checks role
    ├─→ (User) HomeScreen
    │           ↓
    │       SimpleChatScreen (via BottomNav)
    │
    └─→ (Admin) SimpleAdminScreen (directly)
```

---

## Data Models Used

### AppointmentModel
```dart
class AppointmentModel {
  String id
  String userId
  String doctorId
  String procedureId
  String procedureName
  String appointmentDate (YYYY-MM-DD)
  String appointmentTime (HH:MM)
  String status (booked/confirmed/completed/cancelled)
  Timestamp createdAt
}
```

### UserModel
```dart
class UserModel {
  String id
  String email
  String name
  String phone
  String role (user/admin)
  String profileImageUrl
  Timestamp createdAt
  Timestamp updatedAt
}
```

### ChatMessage (used in streams)
```dart
{
  'senderId': String,
  'text': String,
  'timestamp': Timestamp,
  'isUser': bool (for AI mode)
}
```

### AiMessage (AI chat specific)
```dart
{
  'text': String,
  'isUser': bool,
  'timestamp': Timestamp
}
```

---

## Services Used

### ChatService
- `getOrCreateConversation(userId, doctorId)` - Gets or creates conversation
- `sendMessage()` - Sends message to doctor
- `sendAiMessage()` - Saves AI chat message
- `getAiMessages()` - Gets AI chat stream
- `getMessages()` - Gets doctor chat stream
- `getUserUnreadCountStream()` - Gets unread count

### FaqService
- `fetchFaqs()` - Loads FAQs from Firestore
- `getAnswer(query)` - Gets AI response via keyword matching
- `seedInitialFaqs()` - Populates default FAQs

### AppointmentService
- `getAllAppointments()` - Gets stream of all appointments
- `updateAppointmentStatus(id, status)` - Updates appointment status

---

## Common Issues & Solutions

### "Unable to load messages"
**Cause:** Firestore permissions or empty collection
**Solution:** Click "Populate Sample Data" in admin panel

### Doctor chat not initializing
**Cause:** Conversation ID not created
**Solution:** Check that conversation document exists in Firestore

### No appointments showing
**Cause:** Empty appointments collection
**Solution:** Create appointments via "Book Appointment" screen or admin panel

### Firebase authentication errors
**Cause:** User not properly authenticated
**Solution:** Verify Firebase rules allow reading for authenticated users

---

## File Relationships

### SimpleChatScreen imports
- ChatService (for messaging)
- FaqService (for AI responses)
- FirebaseAuth (for current user)
- Colors & Styles constants

### SimpleAdminScreen imports
- AppointmentService (for appointments)
- Firestore (for direct collection access)
- AppRoutes (for navigation)

### Home Screen imports
- SimpleChatScreen (in _screens list)

### Auth Wrapper imports
- SimpleAdminScreen (for admin routing)

---

## Testing SimpleChatScreen

1. Sign in as user
2. Navigate to Chat screen
3. **AI Mode Test:**
   - Type "What is HydraFacial?"
   - Should see FAQ-based response
4. **Doctor Mode Test:**
   - Toggle to Doctor mode
   - Type message
   - Message should appear in Firestore under conversations

## Testing SimpleAdminScreen

1. Sign in with admin account
2. Should see single-screen dashboard
3. **Populate Data Test:**
   - Click "Populate Sample Data"
   - Should see success message
   - Check Firestore for new procedures and FAQs
4. **Appointments Test:**
   - View existing appointments
   - Change status dropdown
   - Verify status updates in Firestore
5. **Users Test:**
   - View all registered users
   - Verify user data displays correctly

