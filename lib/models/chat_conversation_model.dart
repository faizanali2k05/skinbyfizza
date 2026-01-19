import 'package:cloud_firestore/cloud_firestore.dart';

class ChatConversationModel {
  final String id;
  final String userId;
  final String doctorId;
  final String lastMessage;
  final Timestamp updatedAt;
  final int unreadCount; // Unread for Admin
  final int userUnreadCount; // Unread for User

  ChatConversationModel({
    required this.id,
    required this.userId,
    required this.doctorId,
    required this.lastMessage,
    required this.updatedAt,
    this.unreadCount = 0,
    this.userUnreadCount = 0,
  });

  factory ChatConversationModel.fromMap(Map<String, dynamic> data, String documentId) {
    return ChatConversationModel(
      id: documentId,
      userId: data['userId'] ?? '',
      doctorId: data['doctorId'] ?? '',
      lastMessage: data['lastMessage'] ?? '',
      updatedAt: data['updatedAt'] ?? Timestamp.now(),
      unreadCount: data['unreadCount'] ?? 0,
      userUnreadCount: data['userUnreadCount'] ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'doctorId': doctorId,
      'lastMessage': lastMessage,
      'updatedAt': updatedAt,
      'unreadCount': unreadCount,
      'userUnreadCount': userUnreadCount,
    };
  }
}