import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessageModel {
  final String id;
  final String senderId;
  final String receiverId;
  final String text;
  final Timestamp createdAt;
  final bool isRead;

  ChatMessageModel({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.text,
    required this.createdAt,
    this.isRead = false,
  });

  factory ChatMessageModel.fromMap(Map<String, dynamic> data, String documentId) {
    return ChatMessageModel(
      id: documentId,
      senderId: data['senderId'] ?? '',
      receiverId: data['receiverId'] ?? '',
      text: data['text'] ?? '',
      createdAt: data['createdAt'] ?? Timestamp.now(),
      isRead: data['isRead'] ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'senderId': senderId,
      'receiverId': receiverId,
      'text': text,
      'createdAt': createdAt,
      'isRead': isRead,
    };
  }
}