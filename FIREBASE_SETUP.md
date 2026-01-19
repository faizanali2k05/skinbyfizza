# Firebase Setup Guide for SkinByFizza

This document provides step-by-step instructions for setting up Firebase for the SkinByFizza Flutter application.

## Prerequisites

- Firebase account (free tier/Spark Plan)
- Firebase CLI installed
- Flutter project initialized

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: `skinbyfizza`
4. Disable Google Analytics (or enable for tracking)
5. Create project

## Step 2: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Select **Spark Plan** (free tier)
4. Start in **Production Mode**
5. Select location closest to your users (e.g., asia-southeast1)
6. Click "Create"

## Step 3: Enable Authentication

1. Go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password**:
   - Click "Email/Password"
   - Enable it
   - Save
4. Enable **Google Sign-In**:
   - Click "Google"
   - Enable it
   - Add support email
   - Save

## Step 4: Download Firebase Configuration

### For Android:

1. Go to **Project Settings** → **Your apps** → Android app
2. If no Android app exists, click "Add app"
3. Enter package name: `com.example.skinbyfizza`
4. Download `google-services.json`
5. Place it in: `android/app/google-services.json`

### For iOS:

1. Go to **Project Settings** → **Your apps** → iOS app
2. If no iOS app exists, click "Add app"
3. Enter iOS Bundle ID: `com.example.skinbyfizza`
4. Download `GoogleService-Info.plist`
5. Place it in: `ios/Runner/GoogleService-Info.plist`

## Step 5: Configure Firestore Rules

1. In Firebase Console, go to **Firestore Database** → **Rules**
2. Replace the content with the rules from `firestore.rules` in the project root
3. Click "Publish"

Example (copy from `firestore.rules`):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rules from firestore.rules file
  }
}
```

## Step 6: Create Collections & Sample Data

The app will auto-populate on first launch, but you can manually create collections:

### Create Collections:

1. **Firestore Database** → **Create Collection**

2. **users** - User profiles
   - Fields: uid, email, displayName, role, phoneNumber, password (optional), createdAt, status

3. **procedures** - Services/treatments
   - Fields: title, description, price, category, keyFeatures, sessions, visitsPerSession

4. **appointments** - Bookings
   - Fields: userId, doctorId, procedureId, procedureName, appointmentDate, appointmentTime, status, createdAt

5. **conversations** - Chat conversations
   - Fields: userId, doctorId, lastMessage, updatedAt
   - Subcollection: messages

6. **faqs** - AI Assistant FAQs
   - Fields: keywords (array), answer, category

7. **notifications** - User notifications
   - Fields: userId, title, message, type, appointmentId, createdAt, isRead

8. **ai_chat_messages** - AI chat history
   - Fields: userId, message, isUser (boolean), timestamp

## Step 7: Seed Initial Data (Optional)

You can add sample data manually via Firebase Console, or the app will create it automatically.

### Sample Procedure Document:

```json
{
  "title": "HydraFacial",
  "description": "Advanced hydration and cleansing facial",
  "price": 8500,
  "category": "Facial",
  "keyFeatures": ["Hydration", "Cleansing"],
  "sessions": 1,
  "visitsPerSession": 1
}
```

### Sample FAQ Document:

```json
{
  "keywords": ["location", "address", "where"],
  "answer": "We are located at 12-C, Lane 4, DHA Phase 6, Karachi.",
  "category": "info"
}
```

### Sample Admin User:

Create via Firebase Auth, then add to Firestore:

```json
{
  "uid": "ADMIN_UID",
  "email": "admin@skinbyfizza.com",
  "displayName": "Admin",
  "role": "admin",
  "phoneNumber": "03001234567",
  "createdAt": "2026-01-16T00:00:00Z",
  "status": "Active"
}
```

## Step 8: Deploy Firestore Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

## Step 9: Configure Flutter App

The `lib/firebase_options.dart` file should already be generated. If not:

```bash
flutterfire configure --project=skinbyfizza
```

## Step 10: Test Firebase Connection

1. Update `lib/main.dart` to initialize Firebase
2. Run the app:
   ```bash
   flutter run
   ```
3. Test signup with an email
4. Check Firestore to see if user document was created

## Firestore Data Model

### Users Collection

```
users/{uid}
├── email: string
├── displayName: string
├── role: string (user | admin)
├── phoneNumber: string (optional)
├── password: string (optional, not recommended)
├── createdAt: timestamp
└── status: string (Active | Blocked)
```

### Procedures Collection

```
procedures/{docId}
├── title: string
├── description: string
├── price: number
├── category: string
├── imageUrl: string (optional)
├── keyFeatures: array
├── sessions: number
└── visitsPerSession: number
```

### Appointments Collection

```
appointments/{docId}
├── userId: string
├── doctorId: string
├── procedureId: string
├── procedureName: string
├── appointmentDate: string (YYYY-MM-DD)
├── appointmentTime: string (HH:mm)
├── status: string (booked | completed | missed | cancelled)
└── createdAt: timestamp
```

### Conversations Collection

```
conversations/{docId}
├── userId: string
├── doctorId: string
├── lastMessage: string
├── updatedAt: timestamp
└── messages/{messageId}
    ├── senderId: string
    ├── receiverId: string
    ├── text: string
    └── createdAt: timestamp
```

### FAQs Collection

```
faqs/{docId}
├── keywords: array
├── answer: string
└── category: string
```

### Notifications Collection

```
notifications/{docId}
├── userId: string
├── title: string
├── message: string
├── type: string (appointment | chat | system)
├── appointmentId: string (optional)
├── createdAt: timestamp
└── isRead: boolean
```

## Spark Plan Limits

- **Read**: 50,000 per day (generous for small apps)
- **Write**: 20,000 per day
- **Delete**: 20,000 per day
- **Storage**: 1 GB total
- **No real-time database** (but Firestore streaming works fine)
- **No Cloud Functions** (app handles logic)

## Troubleshooting

### "Permission Denied" Error

**Solution:** Check Firestore rules are deployed correctly

```bash
firebase firestore:rules:list
```

### "Index Not Found" Error

**Solution:** Your query requires a composite index. With our rules, this shouldn't happen. If it does:

1. Click the index creation link in error message
2. Firebase will auto-create it

### App Won't Connect to Firebase

**Solution:** 
- Verify `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)
- Check Firebase Console → Project Settings → Service Accounts → Generate new private key
- Verify network connectivity

### Notifications Not Working

**Solution:**
- Check Platform specific permissions (AndroidManifest.xml, Info.plist)
- Ensure notification service is initialized in main.dart

## Important Security Notes

1. **Never commit** `google-services.json` or `GoogleService-Info.plist` to public repos
2. **Use Firestore rules** to enforce security (provided in `firestore.rules`)
3. **Don't store passwords** in Firestore (use Firebase Auth)
4. **Validate input** on client-side before sending to Firestore
5. **Use server timestamps** (`FieldValue.serverTimestamp()`)

## Next Steps

1. ✅ Firebase project created
2. ✅ Firestore database initialized
3. ✅ Authentication enabled
4. ✅ Firestore rules deployed
5. ✅ Collections created
6. 🚀 Run the app and test!

```bash
flutter run
```

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Auth Flutter](https://firebase.flutter.dev/docs/auth/overview/)
- [Cloud Firestore Flutter](https://firebase.flutter.dev/docs/firestore/overview/)

---

**Last Updated:** January 16, 2026
**Firebase Tier:** Spark Plan (Free)
