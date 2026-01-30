# Firebase Deployment Checklist

## ✅ Pre-Deployment (Right Now)

### 1. Deploy Firestore Rules ⭐ CRITICAL
**Status**: Ready to deploy
**File**: `firestore.rules`

**How to Deploy**:
```bash
Option 1: VS Code
  Right-click firestore.rules file
  → "Deploy Firestore Rules"

Option 2: Firebase CLI
  firebase deploy --only firestore:rules

Option 3: Firebase Console
  Go to Firestore Database → Rules tab → Paste rules → Publish
```

**Verify Deployment**:
- Go to Firebase Console → Firestore → Rules tab
- You should see your rules with "STABLE" status

---

### 2. Create Composite Indexes ⭐ IMPORTANT

**Status**: Not yet created (will show errors on first query)

**How to Create**:
1. Go to [Firebase Console](https://console.firebase.google.com/project/YOUR_PROJECT/firestore)
2. Navigate to **Firestore Database** → **Indexes** tab
3. Click **Create Index** for each:

#### Index 1: Appointments - User's Appointments
- Collection: `appointments`
- Field 1: `userId` (Ascending)
- Field 2: `createdAt` (Descending)
- Query scope: Collection

#### Index 2: Appointments - Filter by Status
- Collection: `appointments`
- Field 1: `status` (Ascending)
- Field 2: `createdAt` (Descending)
- Query scope: Collection

#### Index 3: Notifications - User's Notifications
- Collection: `notifications`
- Field 1: `userId` (Ascending)
- Field 2: `createdAt` (Descending)
- Query scope: Collection

#### Index 4: Conversations - User's Chats
- Collection: `conversations`
- Field 1: `userId` (Ascending)
- Field 2: `updatedAt` (Descending)
- Query scope: Collection

#### Index 5: Conversations - Admin's Chats
- Collection: `conversations`
- Field 1: `adminId` (Ascending)
- Field 2: `updatedAt` (Descending)
- Query scope: Collection

**Wait for Status**: "Building" → "Enabled" (5-10 minutes each)

**Verify**: All 5 indexes show "Enabled" status

---

## 🧪 Testing (After Deployment)

### Test 1: Can Read Firestore Rules
```
Expected: ✓ You can read public collections
Error: ✗ Permission-denied → Rules not deployed
```

### Test 2: Can Create User Document
```dart
// During signup
final error = await authService.signUp(
  name: 'Test User',
  email: 'test@example.com',
  phone: '03001234567',
  password: 'password',
);
Expected: ✓ error == null
Error: ✗ 'missing or insufficient permissions' → Check rules
```

### Test 3: Real-time Queries
```dart
// This should work without errors
appointmentService.getUserAppointmentsStream()
Expected: ✓ Real-time stream updates
Error: ✗ 'The query requires an index' → Create missing index
```

### Test 4: Role-based Access
```dart
// Admin query should work
final allAppointments = appointmentService.getAllAppointmentsStream();
Expected: ✓ Stream returns all appointments
Error: ✗ 'Permission-denied' → Check admin role in rules
```

---

## 🚀 Production Deployment

### Before Building APK/IPA

- [ ] Firebase rules deployed
- [ ] 5 composite indexes created and enabled
- [ ] Firestore collections created (empty is OK)
- [ ] Firebase Authentication enabled
- [ ] Google Services JSON files installed:
  - Android: `android/app/google-services.json`
  - iOS: `ios/Runner/GoogleService-Info.plist`
- [ ] All services properly initialized in main.dart
- [ ] Error handling tested in all services
- [ ] Local notifications permissions granted
- [ ] All models use proper fromSnapshot() methods

### Build Android APK
```bash
flutter clean
flutter pub get
flutter build apk --release
# Output: build/app/outputs/flutter-app.apk
```

### Build iOS IPA
```bash
flutter clean
flutter pub get
flutter build ios --release
# Output: build/ios/iphoneos/Runner.app
```

### Submit to App Stores
- **Google Play Store**: Upload APK/AAB
- **Apple App Store**: Upload IPA via Xcode

---

## 📊 Post-Deployment Monitoring

### Check Firestore Usage
1. Go to Firebase Console → Firestore → Usage tab
2. Monitor:
   - Read operations/day
   - Write operations/day
   - Delete operations/day
3. **Spark Plan Limits**: 50k reads, 20k writes, 20k deletes/day

### Monitor Errors
1. Go to Firebase Console → Functions/Logs
2. Check for permission errors
3. Check for index missing errors

### Enable Monitoring
```bash
# In main.dart
Firebase.initializeApp();
FirebaseFirestore.instance.settings = Settings(
  persistenceEnabled: true,
);
```

---

## 🔄 Ongoing Maintenance

### Weekly
- [ ] Check Firestore usage dashboard
- [ ] Review error logs
- [ ] Check for new index requirements

### Monthly
- [ ] Review data growth
- [ ] Check for unused fields/collections
- [ ] Backup important data

### Quarterly
- [ ] Update Firebase SDK
- [ ] Review security rules
- [ ] Optimize slow queries

---

## 🆘 Troubleshooting Deployment

### Issue: "Permission-Denied"
```
Cause: Rules not deployed or don't match operation
Fix: 
  1. Verify rules deployed in Firebase Console
  2. Check user is authenticated
  3. Check user has correct role
  4. Review rule conditions
```

### Issue: "The Query Requires an Index"
```
Cause: Composite index not created or still building
Fix:
  1. Go to Firebase Console → Firestore → Indexes
  2. Create the missing index (error message shows which one)
  3. Wait 5-10 minutes for "Building" → "Enabled"
```

### Issue: "Collection Not Found"
```
Cause: Collection doesn't exist in Firestore
Fix:
  1. Go to Firebase Console → Firestore
  2. Click "Start Collection"
  3. Create collection with ID
  4. Add at least one document
  5. Or let your app create documents automatically
```

### Issue: "Network Error" on First Launch
```
Cause: Firebase initialization not complete
Fix:
  1. Make sure Firebase.initializeApp() is called
  2. Make sure WidgetsFlutterBinding.ensureInitialized() is called first
  3. Check internet connection
```

### Issue: "User Not Found"
```
Cause: User document not created during signup
Fix:
  1. Check authService.signUp() creates user document
  2. Verify Firestore rules allow write to users/{uid}
  3. Check getCurrentUserDocument() after signup
```

---

## ✅ Deployment Success Criteria

- [ ] ✅ Rules deployed (no "Deploy" button visible)
- [ ] ✅ All 5 indexes show "Enabled" status
- [ ] ✅ Can sign up (user document created)
- [ ] ✅ Can sign in (user role fetched)
- [ ] ✅ Can book appointment (notification auto-created)
- [ ] ✅ Can send chat message (notification auto-created)
- [ ] ✅ Real-time updates work (appointments, notifications, chat)
- [ ] ✅ FAQ answers questions
- [ ] ✅ No errors in Firestore logs
- [ ] ✅ App doesn't crash on startup

---

## 📈 Performance Checklist

- [ ] Use real-time streams (not repeated get() calls)
- [ ] Limit query results with .limit()
- [ ] Add proper indexes before querying
- [ ] Cache frequently accessed data (like FAQs)
- [ ] Use WriteBatch for multiple writes
- [ ] Avoid N+1 queries (don't query for each item)
- [ ] Monitor Firestore usage dashboard

---

## 🔐 Security Post-Deployment

- [ ] Review Firestore rules in Console
- [ ] Verify no public read access
- [ ] Test role-based access (user vs admin)
- [ ] Ensure passwords hashed by Firebase Auth
- [ ] Enable 2FA for Firebase Console (optional)
- [ ] Set up Firebase Security Alerts

---

## 📞 Support Resources

If you encounter issues:

1. **Check Documentation**:
   - [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)
   - [FIRESTORE_SCHEMA.md](FIRESTORE_SCHEMA.md)
   - [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

2. **Firebase Docs**:
   - [Firebase Console](https://console.firebase.google.com)
   - [Flutter Firebase](https://firebase.flutter.dev)
   - [Firestore Docs](https://firebase.google.com/docs/firestore)

3. **Check Error Messages**:
   - Most Firestore errors include helpful links
   - Click the link to resolve automatically

---

## 🎯 Timeline

**Today (Day 1)**:
- Deploy firestore.rules
- Create 5 composite indexes
- Test basic operations

**This Week**:
- Build UI screens
- Implement all features
- Test end-to-end

**Next Week**:
- Performance optimization
- Error handling polish
- User testing

**Release Ready**:
- All tests passing
- No errors in logs
- Ready to submit to App Stores

---

## ✨ Final Checklist

Before releasing to production:

- [ ] Rules deployed
- [ ] Indexes created
- [ ] Sign up works
- [ ] Sign in works
- [ ] Appointments work
- [ ] Chat works
- [ ] Notifications work
- [ ] FAQ works
- [ ] No errors in console
- [ ] Tested on real device
- [ ] Performance acceptable
- [ ] Security rules reviewed
- [ ] Firebase Console monitoring set up

---

**Status**: Ready for Deployment ✅  
**Next Action**: Deploy firestore.rules  
**Estimated Time**: 30 minutes  

🚀 **You're ready to deploy!**
