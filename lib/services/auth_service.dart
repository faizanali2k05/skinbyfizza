import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../models/user_model.dart';

/// Authentication Service for Firebase Email/Password & Firestore User sync
/// Manages signup, login, logout, and role-based routing
class AuthService with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Stream of auth state changes
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Get current authenticated user from Firebase Auth
  User? get currentUser => _auth.currentUser;

  /// Get current user ID
  String? get currentUserId => _auth.currentUser?.uid;

  /// Get current user email
  String? get currentUserEmail => _auth.currentUser?.email;

  /// Check if user is authenticated
  bool get isAuthenticated => _auth.currentUser != null;

  // ======================== Authentication =========================

  /// Sign up new user with email/password
  /// Returns error message on failure, null on success
  Future<String?> signUp({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    try {
      // 1. Create user in Firebase Auth
      final UserCredential credential =
          await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      final User? user = credential.user;

      if (user == null) {
        return 'Failed to create user account.';
      }

      // 2. Create user document in Firestore
      final userModel = UserModel(
        uid: user.uid,
        name: name,
        email: email,
        phone: phone,
        role: 'user', // Default role
        photoUrl: '',
      );

      await _firestore.collection('users').doc(user.uid).set(
            userModel.toMap(),
            SetOptions(merge: false),
          );

      notifyListeners();
      return null; // Success
    } on FirebaseAuthException catch (e) {
      return e.message ?? 'Authentication error occurred.';
    } catch (e) {
      return 'Unexpected error: $e';
    }
  }

  /// Sign in existing user with email/password
  /// Returns error message on failure, null on success
  Future<String?> signIn({
    required String email,
    required String password,
  }) async {
    try {
      // 1. Authenticate with Firebase Auth
      await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      final User? user = _auth.currentUser;
      if (user == null) {
        return 'Failed to sign in.';
      }

      // 2. Verify user document exists in Firestore (create if missing)
      final userDoc =
          await _firestore.collection('users').doc(user.uid).get();

      if (!userDoc.exists) {
        // User doc missing - create it for first-time Firebase Auth users
        final username = email.split('@')[0];
        final firstChar = username.isNotEmpty ? username[0].toUpperCase() : '';
        final restOfName = username.length > 1 ? username.substring(1) : '';
        final userModel = UserModel(
          uid: user.uid,
          name: firstChar + restOfName,
          email: user.email ?? email,
          phone: user.phoneNumber ?? '',
          role: 'user',
          photoUrl: user.photoURL ?? '',
        );

        await _firestore.collection('users').doc(user.uid).set(
              userModel.toMap(),
              SetOptions(merge: false),
            );
      }

      notifyListeners();
      return null; // Success
    } on FirebaseAuthException catch (e) {
      return e.message ?? 'Authentication error occurred.';
    } catch (e) {
      return 'Unexpected error: $e';
    }
  }

  /// Sign out current user
  Future<void> signOut() async {
    try {
      await _auth.signOut();
      notifyListeners();
    } catch (e) {
      debugPrint('Sign out error: $e');
    }
  }

  // ======================== User Document Retrieval =========================

  /// Get current user document from Firestore
  /// Used to check role and fetch user data
  Future<UserModel?> getCurrentUserDocument() async {
    try {
      final uid = currentUserId;
      if (uid == null) return null;

      final doc = await _firestore.collection('users').doc(uid).get();
      if (!doc.exists) return null;

      return UserModel.fromSnapshot(doc);
    } catch (e) {
      debugPrint('Get current user document error: $e');
      return null;
    }
  }

  /// Get user by UID
  Future<UserModel?> getUserByUid(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      if (!doc.exists) return null;

      return UserModel.fromSnapshot(doc);
    } catch (e) {
      debugPrint('Get user by UID error: $e');
      return null;
    }
  }

  /// Get current user's role ('user' or 'admin')
  Future<String> getCurrentUserRole() async {
    try {
      final user = await getCurrentUserDocument();
      return user?.role ?? 'user';
    } catch (e) {
      debugPrint('Get current user role error: $e');
      return 'user';
    }
  }

  /// Check if current user is admin
  Future<bool> isCurrentUserAdmin() async {
    final role = await getCurrentUserRole();
    return role == 'admin';
  }

  // ======================== User Profile Updates =========================

  /// Update current user's profile (name, phone, photo)
  Future<String?> updateUserProfile({
    String? name,
    String? phone,
    String? photoUrl,
  }) async {
    try {
      final uid = currentUserId;
      if (uid == null) return 'User not authenticated.';

      final updates = <String, dynamic>{};
      if (name != null) updates['name'] = name;
      if (phone != null) updates['phone'] = phone;
      if (photoUrl != null) updates['photoUrl'] = photoUrl;

      if (updates.isEmpty) return null; // No updates

      await _firestore.collection('users').doc(uid).update(updates);
      notifyListeners();
      return null; // Success
    } catch (e) {
      return 'Error updating profile: $e';
    }
  }

  /// Set user role (admin only)
  /// uid: target user to update
  /// role: 'user' or 'admin'
  Future<String?> setUserRole(String uid, String role) async {
    try {
      // Check if current user is admin
      final isAdmin = await isCurrentUserAdmin();
      if (!isAdmin) {
        return 'Only admins can set user roles.';
      }

      await _firestore
          .collection('users')
          .doc(uid)
          .update({'role': role});

      return null; // Success
    } catch (e) {
      return 'Error setting user role: $e';
    }
  }

  // ======================== Account Management =========================

  /// Send password reset email
  Future<String?> sendPasswordResetEmail(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
      return null; // Success
    } on FirebaseAuthException catch (e) {
      return e.message ?? 'Error sending reset email.';
    } catch (e) {
      return 'Unexpected error: $e';
    }
  }

  /// Delete current user account and Firestore document
  Future<String?> deleteAccount() async {
    try {
      final uid = currentUserId;
      if (uid == null) return 'User not authenticated.';

      // Delete Firestore document
      await _firestore.collection('users').doc(uid).delete();

      // Delete Firebase Auth account
      await _auth.currentUser?.delete();

      notifyListeners();
      return null; // Success
    } on FirebaseAuthException catch (e) {
      return e.message ?? 'Error deleting account.';
    } catch (e) {
      return 'Unexpected error: $e';
    }
  }

  /// Stream of current user document (real-time updates)
  Stream<UserModel?> getCurrentUserStream() {
    final uid = currentUserId;
    if (uid == null) {
      return Stream.value(null);
    }

    return _firestore
        .collection('users')
        .doc(uid)
        .snapshots()
        .map((snapshot) {
      if (!snapshot.exists) return null;
      return UserModel.fromSnapshot(snapshot);
    }).handleError((error) {
      debugPrint('Get current user stream error: $error');
    });
  }

  /// Get user role synchronously (alias for getCurrentUserRole)
  Future<String> getUserRole() async => getCurrentUserRole();
}