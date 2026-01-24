import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../constants/colors.dart';
import '../../services/chat_service.dart';
import '../../models/chat_message_model.dart';

class DoctorChatScreen extends StatefulWidget {
  final String? procedureTitle;
  
  const DoctorChatScreen({super.key, this.procedureTitle});

  @override
  State<DoctorChatScreen> createState() => _DoctorChatScreenState();
}

class _DoctorChatScreenState extends State<DoctorChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ChatService _chatService = ChatService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final ScrollController _scrollController = ScrollController();
  String? _conversationId;
  bool _isLoading = true;
  String _currentUserId = '';
  String _doctorId = 'admin_uid'; // Default doctor ID
  bool _autoScroll = true;

  @override
  void initState() {
    super.initState();
    _initializeConversation();
  }

  Future<void> _initializeConversation() async {
    final currentUser = _auth.currentUser;
    if (currentUser == null) return;

    setState(() {
      _currentUserId = currentUser.uid;
    });

    try {
      final conversationId = await _chatService.getOrCreateConversation(
        _currentUserId,
        _doctorId,
      );

      if (mounted) {
        setState(() {
          _conversationId = conversationId;
          _isLoading = false;
        });
        
        // Auto-scroll after a small delay
        Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
      }
    } catch (e) {
      print('Doctor chat initialization error: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients && _autoScroll) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _conversationId == null) return;

    final currentUser = _auth.currentUser;
    if (currentUser == null) return;

    _messageController.clear();
    
    try {
      await _chatService.sendMessage(
        conversationId: _conversationId!,
        text: text,
        senderId: _currentUserId,
        receiverId: _doctorId,
      );
    } catch (e) {
      print('Error sending message: $e');
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error sending message")));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading || _conversationId == null) {
      return Scaffold(body: const Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text("Doctor Desk", style: TextStyle(color: Colors.black)),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: _chatService.getMessages(_conversationId!),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  print('Doctor chat stream error: ${snapshot.error}');
                  return Center(child: Text('Error: ${snapshot.error}'));
                }
                
                if (!snapshot.hasData) {
                  return const Center(child: Text('No messages yet'));
                }

                final docs = snapshot.data!.docs;
                if (docs.isEmpty) {
                  return const Center(
                    child: Text(
                      'Start a conversation with your doctor',
                      style: TextStyle(color: Colors.grey),
                    ),
                  );
                }

                // Schedule scroll to bottom after frame
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (_autoScroll && _scrollController.hasClients) {
                    _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
                  }
                });

                return ListView.builder(
                  controller: _scrollController,
                  reverse: false, // Don't reverse - show messages chronologically
                  padding: const EdgeInsets.all(16),
                  itemCount: docs.length,
                  itemBuilder: (context, index) {
                    final data = docs[docs.length - 1 - index].data() as Map<String, dynamic>;
                    final message = ChatMessageModel.fromMap(data, docs[docs.length - 1 - index].id);
                    final isMe = message.senderId == _currentUserId;
                    return _buildMessageBubble(message.text, isMe);
                  },
                );
              },
            ),
          ),
          _buildInput(),
        ],
      ),
    );
  }

  Widget _buildInput() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: "Type a message...",
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Colors.grey.shade100,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.send, color: AppColors.primary),
              onPressed: _sendMessage,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(String text, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : Colors.grey.shade200,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
        ),
        child: Text(
          text,
          style: TextStyle(color: isMe ? Colors.white : Colors.black, fontSize: 15),
        ),
      ),
    );
  }
}