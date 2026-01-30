// ============================================
// FLUTTER + FIREBASE INTEGRATION GUIDE
// SkinByFizza - Real-time Sync Setup
// ============================================

/**
 * COMPLETE SETUP & IMPLEMENTATION GUIDE
 * 
 * This document provides comprehensive instructions for integrating
 * Firebase Authentication, Cloud Firestore, and real-time messaging
 * into your Flutter application.
 */

// ============================================
// 1. FIRESTORE COLLECTIONS SCHEMA
// ============================================

/*
users/{uid}
├── uid: string (document ID)
├── name: string
├── email: string
├── phone: string
├── role: string ("user" or "admin")
├── photoUrl: string
└── createdAt: timestamp

procedures/{procedureId}
├── name: string
├── description: string
├── duration: number (minutes)
├── price: number
├── imageUrl: string
├── createdAt: timestamp
└── updatedAt: timestamp

appointments/{appointmentId}
├── userId: string
├── procedureId: string
├── procedureName: string
├── appointmentDate: string (YYYY-MM-DD)
├── appointmentTime: string (HH:mm)
├── status: string ("booked", "confirmed", "completed", "cancelled")
├── notes: string
├── adminNotes: string
├── createdAt: timestamp
└── updatedAt: timestamp

conversations/{conversationId}
├── userId: string
├── adminId: string
├── lastMessage: string
├── lastSenderId: string
├── updatedAt: timestamp
└── createdAt: timestamp

conversations/{conversationId}/messages/{messageId}
├── senderId: string
├── senderName: string
├── senderRole: string ("user" or "admin")
├── text: string
└── createdAt: timestamp

notifications/{notificationId}
├── userId: string
├── title: string
├── message: string
├── type: string ("appointment", "message", "status_update")
├── appointmentId: string (optional)
├── conversationId: string (optional)
├── isRead: boolean
└── createdAt: timestamp

faqs/{faqId}
├── question: string
├── answer: string
├── keywords: array[string]
├── category: string
├── createdAt: timestamp
└── updatedAt: timestamp
*/

// ============================================
// 2. DATA MODELS (ALREADY CREATED)
// ============================================

/*
Location: lib/models/

- user_model.dart
- procedure_model.dart
- appointment_model.dart
- chat_conversation_model.dart
- chat_message_model.dart
- notification_model.dart
- faq_model.dart

All models include:
- toMap() for Firestore serialization
- fromMap() for deserialization
- fromSnapshot() factory from DocumentSnapshot
- copyWith() for immutability
*/

// ============================================
// 3. SERVICES (PRODUCTION-READY)
// ============================================

/*
Location: lib/services/

Key Services Created:
*/

// AUTH SERVICE
/*
AuthService with ChangeNotifier
├── signUp(name, email, phone, password)
├── signIn(email, password)
├── signOut()
├── getCurrentUserDocument()
├── getUserByUid(uid)
├── getCurrentUserRole()
├── isCurrentUserAdmin()
├── updateUserProfile(name, phone, photoUrl)
├── setUserRole(uid, role) - admin only
├── sendPasswordResetEmail(email)
├── deleteAccount()
└── getCurrentUserStream() - real-time user updates

Usage in UI:
Consumer<AuthService>(
  builder: (context, auth, _) {
    if (auth.isAuthenticated) {
      // Show user content
    }
  },
)
*/

// APPOINTMENT SERVICE
/*
AppointmentService
├── getUserAppointmentsStream() - real-time user appointments
├── getAppointmentById(id)
├── bookAppointment(...) - with auto notification
├── getAllAppointmentsStream() - admin only
├── getAppointmentsByStatusStream(status) - admin only
├── updateAppointmentStatus(id, status, notes) - admin + notification
├── updateAppointmentNotes(id, notes)
├── cancelAppointment(id) - with notification
└── deleteAppointment(id) - admin only

Stream Usage:
StreamBuilder<List<AppointmentModel>>(
  stream: appointmentService.getUserAppointmentsStream(),
  builder: (context, snapshot) {
    if (snapshot.hasData) {
      // Use snapshot.data
    }
  },
)
*/

// CHAT SERVICE
/*
ChatService (needs implementation)
├── getOrCreateConversation(userId, adminId)
├── getUserConversationsStream(userId) - real-time
├── getAdminConversationsStream(adminId) - admin only
├── getConversationMessagesStream(conversationId) - real-time ordered
├── sendMessage(conversationId, message) - with auto notification
├── deleteMessage(conversationId, messageId)
└── getMessageById(conversationId, messageId)

Real-time Message Display:
StreamBuilder<List<ChatMessageModel>>(
  stream: chatService.getConversationMessagesStream(convId),
  builder: (context, snapshot) {
    // Messages ordered by createdAt ascending (oldest first)
  },
)
*/

// NOTIFICATION SERVICE
/*
NotificationService (needs enhancement)
├── initialize() - call in main()
├── getUserNotificationsStream(userId) - real-time
├── getUnreadCountStream(userId) - for badge
├── createNotification(model) - called by other services
├── markAsRead(notificationId)
├── markAllAsRead(userId)
├── deleteNotification(id)
└── deleteAllNotifications(userId)

Unread Badge:
StreamBuilder<int>(
  stream: notificationService.getUnreadCountStream(userId),
  builder: (context, snapshot) {
    int badge = snapshot.data ?? 0;
    // Show badge with count
  },
)
*/

// FAQ SERVICE (existing)
/*
FAQService
├── getAllFAQs() - fetch all
├── findMatchingFAQ(userQuery) - keyword matching NO EXTERNAL API
├── getFAQById(id)
├── getFAQsByCategory(category)
└── _cache for performance

Keyword Matching Algorithm:
1. Normalize user input (lowercase, remove special chars)
2. Tokenize into words
3. Match against FAQ keywords and question
4. Return highest scoring result
5. Return default reply if no match
*/

// ============================================
// 4. FIRESTORE SECURITY RULES (COMPLETE)
// ============================================

/*
Location: firestore.rules

Implemented Rules:
✓ Users: can read/write own, admin reads all
✓ Procedures: public read, admin write
✓ Appointments: user sees own, admin sees all
✓ Conversations: participants + admin only
✓ Messages: conversation participants + admin only
✓ Notifications: user sees only own
✓ FAQs: public read, admin write

All validation functions included:
- isAdmin(uid)
- canCreateUser(data)
- validateAppointmentCreate()
- validateConversationCreate()
- validateMessageCreate()
- canUpdateNotification()
*/

// ============================================
// 5. REQUIRED COMPOSITE INDEXES
// ============================================

/*
Create in Firebase Console > Firestore > Indexes

Index 1: Appointments by User + Date
├── Collection: appointments
├── Fields: userId (Asc), createdAt (Desc)
└── Purpose: userAppointmentsStream()

Index 2: Appointments by Status + Date
├── Collection: appointments
├── Fields: status (Asc), createdAt (Desc)
└── Purpose: Admin status filtering

Index 3: Notifications by User + Date
├── Collection: notifications
├── Fields: userId (Asc), createdAt (Desc)
└── Purpose: getUserNotificationsStream()

Index 4: Conversations by User + Update
├── Collection: conversations
├── Fields: userId (Asc), updatedAt (Desc)
└── Purpose: User's conversations list

Index 5: Conversations by Admin + Update
├── Collection: conversations
├── Fields: adminId (Asc), updatedAt (Desc)
└── Purpose: Admin's conversations list

Firebase auto-prompts for missing indexes when you
run queries. Check Firebase Console logs for suggestions.
*/

// ============================================
// 6. PROVIDER SETUP (STATE MANAGEMENT)
// ============================================

/*
In main.dart - already configured:

runApp(
  ChangeNotifierProvider(
    create: (context) => AuthService(),
    child: const SkinbyFizzaApp(),
  ),
);

Usage in screens:
Consumer<AuthService>(
  builder: (context, auth, _) {
    // Access auth.currentUser, auth.isAuthenticated, etc.
  },
)

For other services, create providers:

final appointmentServiceProvider = Provider((ref) {
  return AppointmentService();
});

StreamBuilder for real-time data:
StreamBuilder<List<AppointmentModel>>(
  stream: appointmentService.getUserAppointmentsStream(),
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return LoadingWidget();
    }
    if (snapshot.hasError) {
      return ErrorWidget(snapshot.error.toString());
    }
    final appointments = snapshot.data ?? [];
    // Build UI with appointments
  },
)
*/

// ============================================
// 7. IMPLEMENTATION EXAMPLES
// ============================================

// EXAMPLE 1: Sign Up & Create User Document
/*
Future<void> _signUp(String name, String email, String phone, String password) async {
  final authService = Provider.of<AuthService>(context, listen: false);
  
  final error = await authService.signUp(
    name: name,
    email: email,
    phone: phone,
    password: password,
  );
  
  if (error == null) {
    // Success - navigate to home
    Navigator.pushReplacementNamed(context, '/home');
  } else {
    // Show error
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(error)),
    );
  }
}
*/

// EXAMPLE 2: Login & Check Role
/*
Future<void> _signIn(String email, String password) async {
  final authService = Provider.of<AuthService>(context, listen: false);
  
  final error = await authService.signIn(
    email: email,
    password: password,
  );
  
  if (error == null) {
    // Check role and navigate accordingly
    final isAdmin = await authService.isCurrentUserAdmin();
    
    if (isAdmin) {
      Navigator.pushReplacementNamed(context, '/admin-panel');
    } else {
      Navigator.pushReplacementNamed(context, '/user-home');
    }
  }
}
*/

// EXAMPLE 3: Real-time Appointments Display
/*
@override
Widget build(BuildContext context) {
  final appointmentService = AppointmentService();
  
  return StreamBuilder<List<AppointmentModel>>(
    stream: appointmentService.getUserAppointmentsStream(),
    builder: (context, snapshot) {
      if (snapshot.connectionState == ConnectionState.waiting) {
        return const Center(child: CircularProgressIndicator());
      }
      
      if (snapshot.hasError) {
        return Center(child: Text('Error: ${snapshot.error}'));
      }
      
      if (!snapshot.hasData || snapshot.data!.isEmpty) {
        return const Center(child: Text('No appointments found'));
      }
      
      final appointments = snapshot.data!;
      
      return ListView.builder(
        itemCount: appointments.length,
        itemBuilder: (context, index) {
          final apt = appointments[index];
          return AppointmentCard(
            appointment: apt,
            onCancel: () => _cancelAppointment(apt.id),
          );
        },
      );
    },
  );
}
*/

// EXAMPLE 4: Book Appointment with Auto-Notification
/*
Future<void> bookAppointment({
  required String procedureId,
  required String procedureName,
  required String date,
  required String time,
}) async {
  final service = AppointmentService();
  
  final error = await service.bookAppointment(
    procedureId: procedureId,
    procedureName: procedureName,
    appointmentDate: date,
    appointmentTime: time,
  );
  
  if (error == null) {
    // User sees notification automatically created by service
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Appointment booked successfully!')),
    );
    Navigator.pop(context);
  }
}
*/

// EXAMPLE 5: Real-time Notifications with Badge
/*
@override
Widget build(BuildContext context) {
  final notificationService = NotificationService();
  final authService = Provider.of<AuthService>(context);
  final userId = authService.currentUserId;
  
  return StreamBuilder<int>(
    stream: notificationService.getUnreadCountStream(userId!),
    builder: (context, countSnapshot) {
      final unreadCount = countSnapshot.data ?? 0;
      
      return Stack(
        children: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () => _openNotifications(context),
          ),
          if (unreadCount > 0)
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  unreadCount.toString(),
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ),
        ],
      );
    },
  );
}
*/

// EXAMPLE 6: Chat Real-time Messages
/*
@override
Widget build(BuildContext context) {
  final chatService = ChatService();
  
  return StreamBuilder<List<ChatMessageModel>>(
    stream: chatService.getConversationMessagesStream(conversationId),
    builder: (context, snapshot) {
      if (snapshot.connectionState == ConnectionState.waiting) {
        return const Center(child: CircularProgressIndicator());
      }
      
      final messages = snapshot.data ?? [];
      
      return ListView.builder(
        reverse: true,
        itemCount: messages.length,
        itemBuilder: (context, index) {
          final msg = messages[messages.length - 1 - index];
          final isCurrentUser = msg.senderId == currentUserId;
          
          return Align(
            alignment: isCurrentUser 
              ? Alignment.centerRight 
              : Alignment.centerLeft,
            child: ChatBubble(
              message: msg.text,
              isCurrentUser: isCurrentUser,
              senderName: msg.senderName,
              time: msg.createdAt,
            ),
          );
        },
      );
    },
  );
}
*/

// EXAMPLE 7: FAQ Matching (No External API)
/*
Future<void> _sendFAQQuestion(String userMessage) async {
  final faqService = FaqService();
  
  // Get matching answer from Firestore FAQs
  final answer = await faqService.findMatchingFAQ(userMessage);
  
  // Display as bot message
  setState(() {
    _messages.add(ChatMessage(
      text: answer,
      sender: 'bot',
      timestamp: DateTime.now(),
    ));
  });
}
*/

// ============================================
// 8. ERROR HANDLING
// ============================================

/*
Common Firestore Errors & Fixes:

1. permission-denied
   └─ Check Firestore rules match schema
   └─ Verify user role field in users/{uid}
   └─ Ensure authenticated users

2. failed-precondition (index required)
   └─ Check composite indexes created
   └─ Firebase Console > Firestore > Indexes
   └─ Indexes auto-created on first query

3. not-found
   └─ Verify document/collection exists
   └─ Check document path is correct
   └─ Ensure document was created

4. invalid-argument
   └─ Check query field names match schema
   └─ Verify field types (string, number, etc)
   └─ Ensure orderBy field is indexed

5. unauthenticated
   └─ User not signed in
   └─ Call signIn/signUp before accessing data
   └─ Check authStateChanges stream

6. resource-exhausted (quota)
   └─ Spark plan: 50,000 reads/day
   └─ Cache data when possible
   └─ Use pagination for large lists
   └─ Upgrade to Blaze plan for production
*/

// ============================================
// 9. PERFORMANCE TIPS (SPARK PLAN SAFE)
// ============================================

/*
✓ Use Firestore Streams for real-time updates
✓ Add indexes for filter + sort queries
✓ Cache FAQ data locally
✓ Paginate large lists (limit 20-50 docs)
✓ Compress images before storage
✓ Use FieldValue.increment() for counters
✓ Delete old notifications monthly
✓ Batch writes with WriteBatch
✓ Don't fetch entire collections
✓ Use where() for filtering, not client-side
*/

// ============================================
// 10. TESTING & VERIFICATION
// ============================================

/*
Test Checklist:

□ Sign up creates user document
□ Sign in fetches user document
□ User role determines routing (user vs admin)
□ Real-time appointment stream updates
□ Admin sees all appointments
□ Users see only own appointments
□ Booking appointment creates notification
□ Admin updates appointment status
□ User receives status update notification
□ Chat conversation auto-created
□ Messages appear in real-time
□ Both participants see messages
□ Notifications badge shows count
□ FAQ matching works without API
□ Firestore rules prevent unauthorized access
□ All timestamps use server time

*/

// ============================================
// 11. DEPLOYMENT CHECKLIST
// ============================================

/*
Before Production Release:

□ All Firestore rules reviewed and tested
□ All composite indexes created
□ Firebase Console shows no errors
□ Test with real Firestore data
□ Verify notification triggering
□ Test error scenarios
□ Performance tested with 100+ docs
□ Check billing alerts configured
□ Remove debug print statements
□ Test on real devices (iOS + Android)
□ Verify Google Play/App Store requirements
□ Backup data regularly
□ Monitor Firebase Console daily

*/
