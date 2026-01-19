import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/chat_message_model.dart';
import '../models/chat_conversation_model.dart';

class ChatService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Get current user ID
  String? get currentUserId => _auth.currentUser?.uid;

  // Get or create chat conversation for a user and doctor
  Future<String> getOrCreateConversation(String userId, String doctorId) async {
    try {
      // Try to find existing conversation between user and doctor
      final existingConversation = await _firestore
          .collection('conversations')
          .where('userId', isEqualTo: userId)
          .where('doctorId', isEqualTo: doctorId)
          .limit(1)
          .get();

      if (existingConversation.docs.isNotEmpty) {
        return existingConversation.docs.first.id;
      }
    } catch (e) {
      print('Warning: Could not read existing conversations: $e');
    }

    try {
      // Create new conversation
      final docRef = _firestore.collection('conversations').doc();
      await docRef.set({
        'userId': userId,
        'doctorId': doctorId,
        'lastMessage': '',
        'updatedAt': FieldValue.serverTimestamp(),
      });

      return docRef.id;
    } catch (e) {
      print('Error creating conversation: $e');
      rethrow;
    }
  }

  // Stream of messages for a specific conversation
  Stream<QuerySnapshot> getMessages(String conversationId) {
    return _firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  // Send a message
  Future<void> sendMessage({
    required String conversationId,
    required String text,
    required String senderId,
    required String receiverId,
  }) async {
    if (text.trim().isEmpty) return;

    try {
      // Add message to conversation
      final messageRef = _firestore
          .collection('conversations')
          .doc(conversationId)
          .collection('messages')
          .doc();

      final chatMessage = ChatMessageModel(
        id: messageRef.id,
        senderId: senderId,
        receiverId: receiverId,
        text: text.trim(),
        createdAt: Timestamp.now(),
      );

      await messageRef.set(chatMessage.toMap());

      // Update conversation metadata
      await _firestore.collection('conversations').doc(conversationId).update({
        'lastMessage': text.trim(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      // Create notification for the receiver if they're a user (not admin)
      // This is for when admin sends a message to a user
      if (receiverId != 'admin_uid') {
        try {
          await _firestore.collection('notifications').add({
            'userId': receiverId,
            'title': 'New Message from Doctor',
            'message': text.trim().length > 100 
              ? '${text.trim().substring(0, 100)}...' 
              : text.trim(),
            'type': 'chat',
            'createdAt': FieldValue.serverTimestamp(),
            'isRead': false,
          });
        } catch (notifError) {
          print('Warning: Could not create chat notification: $notifError');
        }
      }
    } catch (e) {
      print('Error sending message: $e');
      rethrow;
    }
  }

  // Get all conversations for a user
  Stream<QuerySnapshot> getUserConversations(String userId) {
    return _firestore
        .collection('conversations')
        .where('userId', isEqualTo: userId)
        .orderBy('updatedAt', descending: true)
        .snapshots();
  }

  // Get all conversations for a doctor/admin
  Stream<QuerySnapshot> getDoctorConversations(String doctorId) {
    return _firestore
        .collection('conversations')
        .where('doctorId', isEqualTo: doctorId)
        .orderBy('updatedAt', descending: true)
        .snapshots();
  }

  // Get conversation by user and doctor IDs
  Future<String?> getConversationId(String userId, String doctorId) async {
    final conversations = await _firestore
        .collection('conversations')
        .where('userId', isEqualTo: userId)
        .where('doctorId', isEqualTo: doctorId)
        .limit(1)
        .get();

    if (conversations.docs.isEmpty) return null;
    return conversations.docs.first.id;
  }

  // Get conversation details
  Stream<DocumentSnapshot> getConversation(String conversationId) {
    return _firestore.collection('conversations').doc(conversationId).snapshots();
  }

  // Mark messages as read
  Future<void> markMessagesAsRead(String conversationId, bool isAdmin) async {
    try {
      // Get unread messages
      final unreadMessages = await _firestore
          .collection('conversations')
          .doc(conversationId)
          .collection('messages')
          .where('isRead', isEqualTo: false)
          .where('senderId', isNotEqualTo: currentUserId)
          .get();

      // Mark each message as read
      final batch = _firestore.batch();
      for (var doc in unreadMessages.docs) {
        batch.update(doc.reference, {'isRead': true});
      }
      await batch.commit();

      // Reset unread count in conversation
      if (isAdmin) {
        await _firestore.collection('conversations').doc(conversationId).update({
          'unreadCount': 0,
        });
      }
    } catch (e) {
      print('Error marking messages as read: $e');
    }
  }

  // Get total unread count for admin
  Future<int> getTotalUnreadCount() async {
    try {
      final conversations = await _firestore.collection('conversations').get();
      int totalUnread = 0;
      
      for (var doc in conversations.docs) {
        final data = doc.data();
        totalUnread += (data['unreadCount'] as int?) ?? 0;
      }
      
      return totalUnread;
    } catch (e) {
      print('Error getting unread count: $e');
      return 0;
    }
  }

  // Stream of total unread count (Admin)
  Stream<int> getTotalUnreadCountStream() {
    return _firestore.collection('conversations').snapshots().map((snapshot) {
      int totalUnread = 0;
      for (var doc in snapshot.docs) {
        final data = doc.data();
        totalUnread += (data['unreadCount'] as int?) ?? 0;
      }
      return totalUnread;
    });
  }

  // Stream of unread count for User (New messages from Admin)
  Stream<int> getUserUnreadCountStream(String userId) {
    return _firestore
        .collection('conversations')
        .where('userId', isEqualTo: userId)
        .limit(1)
        .snapshots()
        .asyncExpand((conversationSnapshot) async* {
          if (conversationSnapshot.docs.isEmpty) {
            yield 0;
            return;
          }
          
          final conversationId = conversationSnapshot.docs.first.id;
          yield* _firestore
              .collection('conversations')
              .doc(conversationId)
              .collection('messages')
              .where('isRead', isEqualTo: false)
              .where('senderId', isNotEqualTo: userId) // Messages NOT sent by user (i.e. from Admin)
              .snapshots()
              .map((snapshot) => snapshot.docs.length);
        });
  }

  // For AI Chat (Root Collection)
  Stream<QuerySnapshot> getAiMessages() {
    final uid = currentUserId;
    if (uid == null) return const Stream.empty();

    return _firestore
        .collection('ai_chat_messages')
        .where('userId', isEqualTo: uid)
        .orderBy('timestamp', descending: true)
        .snapshots();
  }

  /// Send an AI chat message. Returns true on success, false on failure.
  Future<bool> sendAiMessage(String message, bool isUser) async {
    final uid = currentUserId;
    if (uid == null) return false;

    try {
      await _firestore
          .collection('ai_chat_messages')
          .add({
        'userId': uid,
        'message': message,
        'isUser': isUser,
        'timestamp': FieldValue.serverTimestamp(),
      });
      return true;
    } catch (e) {
      print('Error sending AI message: $e');
      return false;
    }
  }

  // Update user profile in conversation (for sync with Profile Edit)
  Future<void> updateConversationUserProfile(String userId, String newName, String newEmail) async {
    try {
      final conversations = await _firestore
          .collection('conversations')
          .where('userId', isEqualTo: userId)
          .get();

      final batch = _firestore.batch();
      for (var doc in conversations.docs) {
        batch.update(doc.reference, {
          'userName': newName,
          'userEmail': newEmail,
        });
      }
      await batch.commit();
    } catch (e) {
      print('Error updating conversation profile: $e');
    }
  }
}