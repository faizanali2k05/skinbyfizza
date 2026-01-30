import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../constants/colors.dart';
import '../../models/chat_conversation_model.dart';
import '../../models/user_model.dart';
import '../../services/chat_service.dart';
import '../chat/unified_chat_screen.dart';

class AdminChatManagerScreen extends StatefulWidget {
  const AdminChatManagerScreen({super.key});

  @override
  State<AdminChatManagerScreen> createState() => _AdminChatManagerScreenState();
}

class _AdminChatManagerScreenState extends State<AdminChatManagerScreen> {
  final ChatService _chatService = ChatService();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  @override
  Widget build(BuildContext context) {
    final adminId = _auth.currentUser?.uid ?? '';
    
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('User Chats',
            style: TextStyle(
                color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _firestore.collection('users').snapshots(),
        builder: (context, userSnapshot) {
          if (userSnapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (userSnapshot.hasError) {
            return Center(child: Text('Error: ${userSnapshot.error}'));
          }

          final users = userSnapshot.data?.docs
                  .map((doc) => UserModel.fromMap(
                      doc.data() as Map<String, dynamic>, doc.id))
                  .where((user) => user.uid != adminId) // Don't show admin themselves
                  .toList() ??
              [];

          return StreamBuilder<List<ChatConversationModel>>(
            stream: _chatService.getDoctorConversationsStream(adminId),
            builder: (context, convoSnapshot) {
              final conversations = {
                for (var convo in convoSnapshot.data ?? [])
                  convo.userId: convo
              };

              // Sort users: those with unread messages first, then those with recent messages, then alphabetically
              users.sort((a, b) {
                final convoA = conversations[a.uid];
                final convoB = conversations[b.uid];

                final unreadA = (convoA?.unreadCount ?? 0) > 0;
                final unreadB = (convoB?.unreadCount ?? 0) > 0;

                if (unreadA != unreadB) {
                  return unreadA ? -1 : 1;
                }

                if (convoA != null && convoB != null) {
                  final timeA = convoA.updatedAt;
                  final timeB = convoB.updatedAt;
                  if (timeA != null && timeB != null) {
                    return timeB.compareTo(timeA);
                  }
                }

                if (convoA != null) return -1;
                if (convoB != null) return 1;

                return a.name.compareTo(b.name);
              });

              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: users.length,
                itemBuilder: (context, index) {
                  final user = users[index];
                  final conversation = conversations[user.uid];
                  return _buildUserChatCard(user, conversation);
                },
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildUserChatCard(UserModel user, ChatConversationModel? conversation) {
    final unreadCount = conversation?.unreadCount ?? 0;
    final lastMessage = conversation?.lastMessage ?? 'No conversation yet';
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Stack(
          children: [
            CircleAvatar(
              backgroundColor: AppColors.primary.withOpacity(0.1),
              radius: 25,
              child: Text(
                user.name.substring(0, 1).toUpperCase(),
                style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 20),
              ),
            ),
            if (unreadCount > 0)
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: const BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 12,
                    minHeight: 12,
                  ),
                ),
              ),
          ],
        ),
        title: Text(
          user.name,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        subtitle: Text(
          lastMessage,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: unreadCount > 0 ? Colors.black : Colors.grey,
            fontWeight: unreadCount > 0 ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (unreadCount > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  unreadCount.toString(),
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold),
                ),
              ),
            const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
          ],
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => UnifiedChatScreen(
                otherUserId: user.uid,
                otherUserName: user.displayName ?? user.email,
              ),
            ),
          );
        },
      ),
    );
  }
}
