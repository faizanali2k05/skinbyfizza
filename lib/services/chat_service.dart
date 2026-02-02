import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../models/chat_message_model.dart';
import '../models/chat_conversation_model.dart';
import '../models/notification_model.dart';

/// Chat Service for real-time doctor-patient conversations
/// Handles conversation creation, messaging, and notifications
class ChatService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String? get currentUserId => _auth.currentUser?.uid;

  // ==================== Conversation Management ======================

  /// Get or create conversation between user and admin
  /// Returns conversation ID
  Future<String?> getOrCreateConversation(String userId, String adminId) async {
    try {
      // Try to find existing conversation
      final existing = await _firestore
          .collection('conversations')
          .where('userId', isEqualTo: userId)
          .where('adminId', isEqualTo: adminId)
          .limit(1)
          .get();

      if (existing.docs.isNotEmpty) {
        return existing.docs.first.id;
      }

      // Create new conversation
      final conversation = ChatConversationModel(
        id: '',
        userId: userId,
        adminId: adminId,
      );

      final docRef = await _firestore
          .collection('conversations')
          .add(conversation.toMap());

      return docRef.id;
    } catch (e) {
      debugPrint('Get or create conversation error: $e');
      return null;
    }
  }

  /// Get user's conversations (real-time, sorted by recent)
  Stream<List<ChatConversationModel>> getUserConversationsStream(String userId) {
    return _firestore
        .collection('conversations')
        .where('userId', isEqualTo: userId)
        .orderBy('updatedAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ChatConversationModel.fromSnapshot(doc))
            .toList())
        .handleError((error) {
          debugPrint('Get user conversations error: $error');
          return <ChatConversationModel>[];
        });
  }

  /// Get admin's conversations (admin only, real-time, sorted by recent)
  Stream<List<ChatConversationModel>> getAdminConversationsStream(String adminId) {
    return _firestore
        .collection('conversations')
        .where('adminId', isEqualTo: adminId)
        .orderBy('updatedAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ChatConversationModel.fromSnapshot(doc))
            .toList())
        .handleError((error) {
          debugPrint('Get admin conversations error: $error');
          return <ChatConversationModel>[];
        });
  }

  /// Get single conversation by ID
  Future<ChatConversationModel?> getConversationById(String conversationId) async {
    try {
      final doc =
          await _firestore.collection('conversations').doc(conversationId).get();

      if (!doc.exists) return null;
      return ChatConversationModel.fromSnapshot(doc);
    } catch (e) {
      debugPrint('Get conversation by ID error: $e');
      return null;
    }
  }

  // ==================== Messages (Real-time) ======================

  /// Get messages from conversation (real-time, ordered ascending by time)
  /// Oldest messages first, new messages appended at end
  Stream<List<ChatMessageModel>> getConversationMessagesStream(
      String conversationId) {
    return _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', descending: false)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ChatMessageModel.fromSnapshot(doc))
            .toList())
        .handleError((error) {
          debugPrint('Get conversation messages error: $error');
          return <ChatMessageModel>[];
        });
  }

  /// Get single message by ID
  Future<ChatMessageModel?> getMessageById(
    String conversationId,
    String messageId,
  ) async {
    try {
      final doc = await _firestore
          .collection('conversations')
          .doc(conversationId)
          .collection('messages')
          .doc(messageId)
          .get();

      if (!doc.exists) return null;
      return ChatMessageModel.fromSnapshot(doc);
    } catch (e) {
      debugPrint('Get message by ID error: $e');
      return null;
    }
  }

  // ==================== Send Message ======================

  /// Send message in conversation
  /// Automatically updates conversation metadata and creates notification
  /// Returns null on success, error message on failure
  Future<String?> sendMessage({
    required String conversationId,
    required String text,
    required String senderId,
    required String senderName,
    required String senderRole,
  }) async {
    try {
      if (text.trim().isEmpty) return 'Message cannot be empty.';

      // Create message
      final message = ChatMessageModel(
        id: '', // Firestore generates ID
        senderId: senderId,
        senderName: senderName,
        senderRole: senderRole,
        text: text.trim(),
      );

      // Add to messages subcollection
      await _firestore
          .collection('conversations')
          .doc(conversationId)
          .collection('messages')
          .add(message.toMap());

      // Update conversation metadata
      await _firestore
          .collection('conversations')
          .doc(conversationId)
          .update({
            'lastMessage': text.trim(),
            'lastSenderId': senderId,
            'updatedAt': FieldValue.serverTimestamp(),
          });

      // Create notification for recipient
      final conversation = await getConversationById(conversationId);
      if (conversation != null) {
        final recipientId =
            senderRole == 'admin' ? conversation.userId : conversation.adminId;

        final notification = NotificationModel(
          id: '',
          userId: recipientId,
          title: senderRole == 'admin' ? 'New Message from Doctor' : 'New Message',
          message: text.trim().length > 100
              ? '${text.trim().substring(0, 100)}...'
              : text.trim(),
          type: 'message',
          conversationId: conversationId,
        );

        await _firestore
            .collection('notifications')
            .add(notification.toMap());
      }

      return null; // Success
    } catch (e) {
      return 'Error sending message: $e';
    }
  }

  // ==================== Delete Message ======================

  /// Delete message (sender or admin only)
  Future<String?> deleteMessage(String conversationId, String messageId) async {
    try {
      await _firestore
          .collection('conversations')
          .doc(conversationId)
          .collection('messages')
          .doc(messageId)
          .delete();

      return null; // Success
    } catch (e) {
      return 'Error deleting message: $e';
    }
  }

  // ==================== Unread Count (Optional) ======================

  /// Get unread message count for user in a conversation
  /// (For badge or notification display)
  /// This requires storing read status in messages subcollection
  /// For now, you can use conversation.updatedAt to show "has unread"
  Future<int> getUnreadCountForConversation(
    String conversationId,
    String userId,
  ) async {
    try {
      final conversation = await getConversationById(conversationId);
      if (conversation == null) return 0;

      // Count messages from the other person that haven't been read
      // This would require adding 'isRead' field to messages
      // For MVP, you can just count total messages
      final messages = await _firestore
          .collection('conversations')
          .doc(conversationId)
          .collection('messages')
          .get();

      return messages.docs.length;
    } catch (e) {
      debugPrint('Get unread count error: $e');
      return 0;
    }
  }

  /// Get doctor conversations (admin view) - Real-time stream
  Stream<List<ChatConversationModel>> getDoctorConversationsStream(String doctorId) {
    return _firestore
        .collection('conversations')
        .where('adminId', isEqualTo: doctorId)
        .orderBy('updatedAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ChatConversationModel.fromSnapshot(doc))
            .toList())
        .handleError((error) {
          debugPrint('Get doctor conversations stream error: $error');
          return <ChatConversationModel>[];
        });
  }

  /// Get doctor conversations (admin view) - Future-based version
  Future<List<ChatConversationModel>> getDoctorConversations(String doctorId) async {
    try {
      final snapshot = await _firestore
          .collection('conversations')
          .where('adminId', isEqualTo: doctorId)
          .orderBy('updatedAt', descending: true)
          .get();
      return snapshot.docs
          .map((doc) => ChatConversationModel.fromSnapshot(doc))
          .toList();
    } catch (e) {
      debugPrint('Get doctor conversations error: $e');
      return [];
    }
  }

  /// Mark messages as read
  Future<void> markMessagesAsRead(String conversationId) async {
    try {
      final messages = await _firestore
          .collection('conversations')
          .doc(conversationId)
          .collection('messages')
          .get();

      for (var doc in messages.docs) {
        await doc.reference.update({'isRead': true});
      }
    } catch (e) {
      debugPrint('Mark messages as read error: $e');
    }
  }

  /// Get messages (streaming - real-time)
  Stream<List<ChatMessageModel>> getMessagesStream(String conversationId) {
    return _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ChatMessageModel.fromSnapshot(doc))
            .toList())
        .handleError((error) {
          debugPrint('Get messages stream error: $error');
          return <ChatMessageModel>[];
        });
  }

  /// Get messages (non-streaming version)
  Future<List<ChatMessageModel>> getMessages(String conversationId) async {
    try {
      final snapshot = await _firestore
          .collection('conversations')
          .doc(conversationId)
          .collection('messages')
          .orderBy('createdAt', descending: true)
          .get();
      return snapshot.docs
          .map((doc) => ChatMessageModel.fromSnapshot(doc))
          .toList();
    } catch (e) {
      debugPrint('Get messages error: $e');
      return [];
    }
  }


  /// Get total unread count for user across all conversations
  Future<int> getTotalUnreadCount(String userId) async {
    try {
      final conversations = await _firestore
          .collection('conversations')
          .where('userId', isEqualTo: userId)
          .get();

      int totalUnread = 0;
      for (var doc in conversations.docs) {
        final conv = ChatConversationModel.fromSnapshot(doc);
        totalUnread += conv.unreadCount;
      }

      return totalUnread;
    } catch (e) {
      debugPrint('Get total unread count error: $e');
      return 0;
    }
  }

  /// Get user unread count stream
  Stream<int> getUserUnreadCountStream(String userId) {
    return _firestore
        .collection('conversations')
        .where('userId', isEqualTo: userId)
        .snapshots()
        .map((snapshot) {
      int totalUnread = 0;
      for (var doc in snapshot.docs) {
        final conv = ChatConversationModel.fromSnapshot(doc);
        totalUnread += conv.unreadCount;
      }
      return totalUnread;
    }).handleError((error) {
      debugPrint('Get user unread count stream error: $error');
      return 0;
    });
  }

  /// Update conversation user profile
  Future<void> updateConversationUserProfile(String conversationId, String userName) async {
    try {
      await _firestore
          .collection('conversations')
          .doc(conversationId)
          .update({'lastSenderId': userName});
    } catch (e) {
      debugPrint('Update conversation user profile error: $e');
    }
  }

  /// Force refresh conversation by updating timestamp
  Future<void> forceRefreshConversation(String conversationId) async {
    try {
      await _firestore
          .collection('conversations')
          .doc(conversationId)
          .update({'updatedAt': FieldValue.serverTimestamp()});
    } catch (e) {
      debugPrint('Force refresh conversation error: $e');
    }
  }
}