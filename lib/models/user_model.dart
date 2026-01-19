import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String email;
  final String? displayName;
  final String role; // 'client' or 'admin'
  final String? phoneNumber;
  final String? password; // Storing as requested, though not recommended security practice
  final DateTime? createdAt;
  final String status; // 'Active', 'Blocked'

  UserModel({
    required this.uid,
    required this.email,
    this.displayName,
    this.role = 'client',
    this.phoneNumber,
    this.password,
    this.createdAt,
    this.status = 'Active',
  });

  factory UserModel.fromMap(Map<String, dynamic> data, String documentId) {
    return UserModel(
      uid: documentId,
      email: data['email'] ?? '',
      displayName: data['displayName'],
      role: data['role'] ?? 'client',
      phoneNumber: data['phoneNumber'],
      password: data['password'],
      createdAt: data['createdAt'] != null ? (data['createdAt'] as Timestamp).toDate() : null,
      status: data['status'] ?? 'Active',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'displayName': displayName,
      'role': role,
      'phoneNumber': phoneNumber,
      'password': password,
      'createdAt': createdAt != null ? Timestamp.fromDate(createdAt!) : FieldValue.serverTimestamp(),
      'status': status,
    };
  }
}
