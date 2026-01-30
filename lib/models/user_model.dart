import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String name;
  final String displayName;
  final String email;
  final String phone;
  final String phoneNumber;
  final String role; // 'user' or 'admin'
  final String photoUrl;
  final String status;
  final DateTime? createdAt;

  UserModel({
    required this.uid,
    required this.name,
    this.displayName = '',
    required this.email,
    required this.phone,
    this.phoneNumber = '',
    this.role = 'user',
    this.photoUrl = '',
    this.status = 'active',
    this.createdAt,
  });

  /// Convert UserModel to Firestore Map
  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'displayName': displayName,
      'email': email,
      'phone': phone,
      'phoneNumber': phoneNumber,
      'role': role,
      'photoUrl': photoUrl,
      'status': status,
      'createdAt': createdAt != null 
          ? Timestamp.fromDate(createdAt!) 
          : FieldValue.serverTimestamp(),
    };
  }

  /// Create UserModel from Firestore document
  factory UserModel.fromMap(Map<String, dynamic> data, String documentId) {
    return UserModel(
      uid: documentId,
      name: data['name'] ?? '',
      displayName: data['displayName'] ?? data['name'] ?? '',
      email: data['email'] ?? '',
      phone: data['phone'] ?? '',
      phoneNumber: data['phoneNumber'] ?? data['phone'] ?? '',
      role: data['role'] ?? 'user',
      photoUrl: data['photoUrl'] ?? '',
      status: data['status'] ?? 'active',
      createdAt: data['createdAt'] != null 
          ? (data['createdAt'] as Timestamp).toDate() 
          : null,
    );
  }

  /// Create from snapshot
  factory UserModel.fromSnapshot(DocumentSnapshot snapshot) {
    return UserModel.fromMap(
      snapshot.data() as Map<String, dynamic>,
      snapshot.id,
    );
  }

  /// CopyWith method for immutability
  UserModel copyWith({
    String? uid,
    String? name,
    String? displayName,
    String? email,
    String? phone,
    String? phoneNumber,
    String? role,
    String? photoUrl,
    String? status,
    DateTime? createdAt,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      name: name ?? this.name,
      displayName: displayName ?? this.displayName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      role: role ?? this.role,
      photoUrl: photoUrl ?? this.photoUrl,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() =>
      'UserModel(uid: $uid, name: $name, email: $email, role: $role)';
}
