import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../constants/colors.dart';
import '../../services/chat_service.dart';
import '../../models/chat_message_model.dart';

/// Simple unified chat screen for both users and admin
/// Users chat with admin (admin_uid)
/// Admin chats with individual users
class UnifiedChatScreen extends StatefulWidget {
  final String? otherUserId; // For admin: the user they're chatting with
  final String? otherUserName; // For admin: the user's name
  
  const UnifiedChatScreen({
    super.key,
    this.otherUserId,
    this.otherUserName,
  });

  @override
  State<UnifiedChatScreen> createState() => _UnifiedChatScreenState();
}

class _UnifiedChatScreenState extends State<UnifiedChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ChatService _chatService = ChatService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final ScrollController _scrollController = ScrollController();
  
  String? _conversationId;
  bool _isLoading = true;
  String _currentUserId = '';
  String _currentUserName = 'User'; // Current user's name for messages
  String _otherUserId = ''; // The other person in the conversation
  bool _isAdmin = false;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  Future<void> _initializeChat() async {
    final currentUser = _auth.currentUser;
    if (currentUser == null) {
      print('UnifiedChatScreen: No current user');
      return;
    }

    _currentUserId = currentUser.uid;
    
    // Determine if current user is admin by checking their role in the database
    DocumentSnapshot userDoc = await FirebaseFirestore.instance.collection('users').doc(_currentUserId).get();
    final isCurrentUserAdmin = userDoc.exists && userDoc.data() != null && (userDoc.data() as Map<String, dynamic>)['role'] == 'admin';
    
    String userId, adminId;
    if (isCurrentUserAdmin) {
      // Admin mode: chatting with the user passed in
      _isAdmin = true;
      _otherUserId = widget.otherUserId ?? '';
      userId = _otherUserId;  // The user being chatted with
      adminId = _currentUserId;  // The admin
    } else {
      // User mode: always chatting with admin
      _isAdmin = false;
      userId = _currentUserId;  // The current user
      
      // Find the actual admin user ID
      final adminQuery = await FirebaseFirestore.instance
          .collection('users')
          .where('role', isEqualTo: 'admin')
          .limit(1)
          .get();
          
      if (adminQuery.docs.isNotEmpty) {
        adminId = adminQuery.docs.first.id;
        _otherUserId = adminId;
      } else {
        // No admin found in the system
        print('UnifiedChatScreen: No admin found.');
        if (mounted) {
          setState(() {
            _isLoading = false;
            _conversationId = null; // Important: stay null to show error/empty state
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Our doctors are currently unavailable. Please try again later.')),
          );
        }
        return;
      }
    }

    if (_otherUserId.isEmpty) {
      print('UnifiedChatScreen: Other user ID is empty, aborting');
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    try {
      final conversationId = await _chatService.getOrCreateConversation(userId, adminId);
      
      if (mounted) {
        setState(() {
          _conversationId = conversationId;
          _isLoading = false;
        });
        
        // Mark messages as read
        if (conversationId != null) {
          await _chatService.markMessagesAsRead(conversationId);
        }
        
        // Scroll to bottom after a delay
        Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
      }
    } catch (e) {
      print('UnifiedChatScreen: Chat initialization error: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _conversationId == null) return;

    _messageController.clear();

    try {
      await _chatService.sendMessage(
        conversationId: _conversationId!,
        text: text,
        senderId: _currentUserId,
        senderName: _currentUserName,
        senderRole: _isAdmin ? 'admin' : 'user',
      );
      
      // Force refresh the conversation to ensure real-time updates
      await _chatService.forceRefreshConversation(_conversationId!);
      
      // Auto-scroll to new message
      Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
    } catch (e) {
      print('Error sending message: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: Could not send message')),
        );
      }
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Chat'),
          backgroundColor: Colors.white,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_conversationId == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Chat'),
          backgroundColor: Colors.white,
        ),
        body: const Center(
          child: Text('Unable to load chat. Please try again.'),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: Text(
          _isAdmin ? (widget.otherUserName ?? 'User') : 'Doctor',
          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Messages List
          Expanded(
            child: StreamBuilder<List<ChatMessageModel>>(
              stream: _chatService.getMessagesStream(_conversationId!),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  print('UnifiedChatScreen Error: ${snapshot.error}');
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
                            'Unable to load messages. Please check your connection.',
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

                final messages = snapshot.data ?? [];
                if (messages.isEmpty) {
                  return Center(
                    child: Text(
                      _isAdmin 
                        ? 'Start a conversation with this user'
                        : 'Start a conversation with your doctor',
                      style: const TextStyle(color: Colors.grey),
                    ),
                  );
                }

                // Auto-scroll to bottom on new messages
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (_scrollController.hasClients) {
                    _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
                  }
                });

                return ListView.builder(
                  controller: _scrollController,
                  reverse: false,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[messages.length - 1 - index];
                    final isMe = message.senderId == _currentUserId;
                    return _buildMessageBubble(message.text, isMe);
                  },
                );
              },
            ),
          ),

          // Input Field
          _buildInputField(),
        ],
      ),
    );
  }

  Widget _buildInputField() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
                maxLines: null,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendMessage(),
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            CircleAvatar(
              backgroundColor: AppColors.primary,
              child: IconButton(
                icon: const Icon(Icons.send, color: Colors.white),
                onPressed: _sendMessage,
              ),
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
        margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 0),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(12),
        ),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Text(
          text,
          style: TextStyle(
            color: isMe ? Colors.white : Colors.black87,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}
