import 'package:cloud_firestore/cloud_firestore.dart';

class ChatConversationModel {
  final String id;
  final String userId;
  final String doctorId;
  final String lastMessage;
  final Timestamp updatedAt;

  ChatConversationModel({
    required this.id,
    required this.userId,
    required this.doctorId,
    required this.lastMessage,
    required this.updatedAt,
  });

  factory ChatConversationModel.fromMap(Map<String, dynamic> data, String documentId) {
    return ChatConversationModel(
      id: documentId,
      userId: data['userId'] ?? '',
      doctorId: data['doctorId'] ?? '',
      lastMessage: data['lastMessage'] ?? '',
      updatedAt: data['updatedAt'] ?? Timestamp.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'doctorId': doctorId,
      'lastMessage': lastMessage,
      'updatedAt': updatedAt,
    };
  }
}