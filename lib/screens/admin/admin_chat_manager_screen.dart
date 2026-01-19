import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../constants/colors.dart';
import '../../models/chat_conversation_model.dart';
import '../../services/chat_service.dart';
import 'admin_chat_screen.dart';

class AdminChatManagerScreen extends StatefulWidget {
  const AdminChatManagerScreen({super.key});

  @override
  State<AdminChatManagerScreen> createState() => _AdminChatManagerScreenState();
}

class _AdminChatManagerScreenState extends State<AdminChatManagerScreen> {
  final ChatService _chatService = ChatService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  String _adminId = 'admin_uid'; // Default admin ID

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Chat Management', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _chatService.getDoctorConversations(_adminId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(
              child: Text(
                'No active chats',
                style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
              ),
            );
          }

          final conversations = snapshot.data!.docs.map((doc) {
            return ChatConversationModel.fromMap(doc.data() as Map<String, dynamic>, doc.id);
          }).toList();

          return RefreshIndicator(
            onRefresh: () async {},
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: conversations.length,
              itemBuilder: (context, index) {
                final conversation = conversations[index];
                return _buildConversationCard(conversation);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildConversationCard(ChatConversationModel conversation) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Icon(
            Icons.chat,
            color: AppColors.primary,
          ),
        ),
        title: Text(
          'User: ${conversation.userId}',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          conversation.lastMessage.isEmpty 
              ? 'No messages yet' 
              : conversation.lastMessage,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () {
          // Navigate to chat screen
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => AdminChatScreen(
                userId: conversation.userId,
                userName: 'User ${conversation.userId.substring(0, 6)}', // Show partial user ID as name
              ),
            ),
          );
        },
      ),
    );
  }
}
