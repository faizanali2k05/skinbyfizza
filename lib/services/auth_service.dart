import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../models/user_model.dart';

class AuthService with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();
  
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Fetch user role from Firestore
  Future<String> getUserRole(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      if (doc.exists) {
        return doc.data()?['role'] ?? 'client';
      }
      return 'client';
    } catch (e) {
      return 'client';
    }
  }

  // Set user role (for admin purposes)
  Future<void> setUserRole(String uid, String role) async {
    try {
      await _firestore.collection('users').doc(uid).update({'role': role});
    } catch (e) {
      print('Error setting user role: $e');
    }
  }

  Future<String?> signUp({required String email, required String password}) async {
    try {
      final UserCredential credential = await _auth.createUserWithEmailAndPassword(email: email, password: password);
      final User? user = credential.user;
      
      if (user != null) {
        // Create user profile in Firestore
        final newUser = UserModel(
          uid: user.uid,
          email: user.email ?? email,
          displayName: email.split('@')[0], // Use part of email as display name
          role: 'client', // Default to client
          phoneNumber: user.phoneNumber,
        );
        await _firestore.collection('users').doc(user.uid).set(newUser.toMap());
      }
      
      return "Success";
    } on FirebaseAuthException catch (e) {
      return e.message;
    } catch (e) {
      return "An unknown error occurred.";
    }
  }

  Future<String?> signIn({required String email, required String password}) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      final User? user = _auth.currentUser;
      
      if (user != null) {
        // Check if user exists in Firestore, if not create it
        final userDoc = await _firestore.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
          final newUser = UserModel(
            uid: user.uid,
            email: user.email ?? email,
            displayName: user.displayName ?? email.split('@')[0],
            role: 'client', // Default to client
            phoneNumber: user.phoneNumber,
          );
          await _firestore.collection('users').doc(user.uid).set(newUser.toMap());
        }
      }
      
      return "Success";
    } on FirebaseAuthException catch (e) {
      return e.message;
    } catch (e) {
      return "An unknown error occurred.";
    }
  }

  Future<String?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null; // User canceled

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final UserCredential userCredential = await _auth.signInWithCredential(credential);
      final User? user = userCredential.user;

      if (user != null) {
        // Check if user exists in Firestore
        final userDoc = await _firestore.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
          final newUser = UserModel(
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName,
            role: 'client', // Default to client
            phoneNumber: user.phoneNumber,
          );
          await _firestore.collection('users').doc(user.uid).set(newUser.toMap());
        }
        
        // Return Success (UI checks role separately) or logic here could return role
        // For consistency with existing signIn, we just return "Success" and let UI fetch role
        return "Success";
      }
      return "An unknown error occurred.";
    } catch (e) {
      return e.toString();
    }
  }

  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
    notifyListeners(); // Notify UI to rebuild and show Login screen
  }
}