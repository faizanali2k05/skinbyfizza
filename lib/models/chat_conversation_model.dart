import 'package:cloud_firestore/cloud_firestore.dart';

class ChatConversationModel {
  final String id;
  final String userId;
  final String adminId;
  final String lastMessage;
  final String lastSenderId;
  final int unreadCount;
  final DateTime? updatedAt;
  final DateTime? createdAt;

  ChatConversationModel({
    required this.id,
    required this.userId,
    required this.adminId,
    this.lastMessage = '',
    this.lastSenderId = '',
    this.unreadCount = 0,
    this.updatedAt,
    this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'adminId': adminId,
      'lastMessage': lastMessage,
      'lastSenderId': lastSenderId,
      'unreadCount': unreadCount,
      'updatedAt': updatedAt != null ? Timestamp.fromDate(updatedAt!) : FieldValue.serverTimestamp(),
      'createdAt': createdAt != null ? Timestamp.fromDate(createdAt!) : FieldValue.serverTimestamp(),
    };
  }

  factory ChatConversationModel.fromMap(Map<String, dynamic> data, String documentId) {
    return ChatConversationModel(
      id: documentId,
      userId: data['userId'] ?? '',
      adminId: data['adminId'] ?? '',
      lastMessage: data['lastMessage'] ?? '',
      lastSenderId: data['lastSenderId'] ?? '',
      unreadCount: data['unreadCount'] ?? 0,
      updatedAt: data['updatedAt'] != null ? (data['updatedAt'] as Timestamp).toDate() : null,
      createdAt: data['createdAt'] != null ? (data['createdAt'] as Timestamp).toDate() : null,
    );
  }

  factory ChatConversationModel.fromSnapshot(DocumentSnapshot snapshot) {
    return ChatConversationModel.fromMap(snapshot.data() as Map<String, dynamic>, snapshot.id);
  }
}