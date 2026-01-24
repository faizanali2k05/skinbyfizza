import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../constants/colors.dart';
import '../../services/chat_service.dart';
import '../../models/chat_message_model.dart';

class AdminChatScreen extends StatefulWidget {
  final String? userId;
  final String? userName;
  
  const AdminChatScreen({super.key, this.userId, this.userName});

  @override
  State<AdminChatScreen> createState() => _AdminChatScreenState();
}

class _AdminChatScreenState extends State<AdminChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ChatService _chatService = ChatService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final ScrollController _scrollController = ScrollController();
  String? _conversationId;
  bool _isLoading = true;
  String _targetUserId = '';
  bool _autoScroll = true;

  @override
  void initState() {
    super.initState();
    _targetUserId = widget.userId ?? '';
    _initializeConversation();
  }

  Future<void> _initializeConversation() async {
    final currentUser = _auth.currentUser;
    if (currentUser == null) {
      print('AdminChatScreen: No current user');
      return;
    }

    if (_targetUserId.isEmpty) {
      _targetUserId = currentUser.uid;
    }

    print('AdminChatScreen: Initializing conversation for user: $_targetUserId');
    try {
      final conversationId = await _chatService.getOrCreateConversation(
        _targetUserId,  // userId (the user being chatted with)
        currentUser.uid,  // doctorId (the admin)
      );

      print('AdminChatScreen: Got conversation ID: $conversationId');
      if (mounted) {
        setState(() {
          _conversationId = conversationId;
          _isLoading = false;
        });
        
        // Mark messages as read when opening the chat
        print('AdminChatScreen: Marking messages as read');
        await _chatService.markMessagesAsRead(conversationId, true);
        
        // Auto-scroll after a small delay
        Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
      }
    } catch (e) {
      print('AdminChatScreen: Chat initialization error: $e');
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
        senderId: currentUser.uid,
        receiverId: _targetUserId,
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
        title: Text(widget.userName ?? "User Chat", style: const TextStyle(color: Colors.black)),
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
                  print('AdminChatScreen stream error: ${snapshot.error}');
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline, color: Colors.red, size: 48),
                          const SizedBox(height: 16),
                          const Text(
                            'Connection Error',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Unable to load messages. Check your connection.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.grey[600], fontSize: 14),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => setState(() {}),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }
                
                if (!snapshot.hasData) {
                  return const Center(child: Text('No messages yet'));
                }

                final docs = snapshot.data!.docs;
                if (docs.isEmpty) {
                  return const Center(
                    child: Text(
                      'Start a conversation with the user',
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
                    final isMe = message.senderId == _auth.currentUser?.uid;
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