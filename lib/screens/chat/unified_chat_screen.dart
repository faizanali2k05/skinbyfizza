import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import '../../constants/colors.dart';
import '../../constants/styles.dart';
import '../../services/chat_service.dart';
import '../../models/chat_message_model.dart';
import '../../widgets/chat_bubble.dart';

/// Simple unified chat screen for both users and admin
/// Users chat with admin (admin_uid)
/// Admin chats with individual users
class UnifiedChatScreen extends StatefulWidget {
  final String? otherUserId; // For admin: the user they're chatting with
  final String? otherUserName; // For admin: the user's name
  final String? preFilledMessage; // Pre-filled message to send automatically
  
  const UnifiedChatScreen({
    super.key,
    this.otherUserId,
    this.otherUserName,
    this.preFilledMessage,
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
  bool _isSending = false;
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
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Authentication required. Please sign in.')),
        );
      }
      return;
    }

    _currentUserId = currentUser.uid;
    _currentUserName = currentUser.displayName ?? 'User';
    
    try {
      // Determine if current user is admin by checking their role in the database
      DocumentSnapshot userDoc = await FirebaseFirestore.instance.collection('users').doc(_currentUserId).get();
      final userData = userDoc.data() as Map<String, dynamic>?;
      
      if (userData == null) {
        if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('User profile not found. Please contact support.')),
          );
        }
        return;
      }
      
      final isCurrentUserAdmin = userData['role'] == 'admin';
      
      String userId, adminId;
      if (isCurrentUserAdmin) {
        // Admin mode: chatting with the user passed in
        _isAdmin = true;
        _otherUserId = widget.otherUserId ?? '';
        if (_otherUserId.isEmpty) {
          if (mounted) {
            setState(() => _isLoading = false);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('User information not provided.')),
            );
          }
          return;
        }
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
            
        if (adminQuery.docs.isEmpty) {
          // No admin found in the system
          if (mounted) {
            setState(() {
              _isLoading = false;
              _conversationId = null;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Our doctors are currently unavailable. Please try again later.')),
            );
          }
          return;
        }
        
        adminId = adminQuery.docs.first.id;
        _otherUserId = adminId;
      }

      // Get or create conversation
      final conversationId = await _chatService.getOrCreateConversation(userId, adminId);
      
      if (conversationId == null) {
        throw Exception('Failed to create conversation');
      }
      
      if (mounted) {
        setState(() {
          _conversationId = conversationId;
          _isLoading = false;
        });
        
        // Mark messages as read
        await _chatService.markMessagesAsRead(conversationId);
        
        // Send pre-filled message if provided and this is a new conversation
        if (widget.preFilledMessage != null && widget.preFilledMessage!.isNotEmpty) {
          // Check if this is likely the first message in the conversation
          final messages = await FirebaseFirestore.instance
              .collection('conversations')
              .doc(conversationId)
              .collection('messages')
              .limit(1)
              .get();
          
          if (messages.docs.isEmpty) {
            // This is a new conversation, send the pre-filled message
            await Future.delayed(const Duration(milliseconds: 500));
            _messageController.text = widget.preFilledMessage!;
            await _sendMessage();
          }
        }
        
        // Scroll to bottom after a delay
        Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
      }
    } catch (e) {
      print('UnifiedChatScreen: Chat initialization error: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load chat: ${e.toString()}')),
        );
      }
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _conversationId == null || _isSending) return;

    setState(() => _isSending = true);
    _messageController.clear();

    try {
      final error = await _chatService.sendMessage(
        conversationId: _conversationId!,
        text: text,
        senderId: _currentUserId,
        senderName: _currentUserName,
        senderRole: _isAdmin ? 'admin' : 'user',
      );
      
      if (error != null) {
        throw Exception(error);
      }
      
      // Auto-scroll to new message
      Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
    } catch (e) {
      print('Error sending message: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: Could not send message - ${e.toString()}')),
        );
        // Restore the message in case of error
        _messageController.text = text;
      }
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
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
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Chat', style: TextStyle(color: AppColors.textPrimary)),
          backgroundColor: Colors.white,
          elevation: 0.5,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: AppColors.primary),
              SizedBox(height: 16),
              Text('Loading conversation...', style: TextStyle(fontSize: 16, color: AppColors.textSecondary)),
            ],
          ),
        ),
      );
    }

    if (_conversationId == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Chat', style: TextStyle(color: AppColors.textPrimary)),
          backgroundColor: Colors.white,
          elevation: 0.5,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.chat_bubble_outline, size: 64, color: AppColors.textSecondary),
                const SizedBox(height: 24),
                const Text(
                  'Unable to load chat',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 12),
                Text(
                  'Please check your internet connection and try again.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, color: AppColors.textSecondary, height: 1.4),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _initializeChat,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 1,
        title: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: Colors.white.withOpacity(0.2),
              child: Icon(
                _isAdmin ? Icons.person : Icons.local_hospital,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _isAdmin ? (widget.otherUserName ?? 'Patient') : 'Dr. Fizza',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  const Text(
                    'Online',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                builder: (context) => Container(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Chat Options', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      ListTile(
                        leading: const Icon(Icons.info_outline),
                        title: const Text('Conversation Info'),
                        onTap: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages List
          Expanded(
            child: StreamBuilder<List<ChatMessageModel>>(
              stream: _chatService.getMessagesStream(_conversationId!),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator(color: AppColors.primary));
                }
                
                if (snapshot.hasError) {
                  print('UnifiedChatScreen Error: ${snapshot.error}');
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.error_outline, color: AppColors.error, size: 48),
                          const SizedBox(height: 16),
                          const Text(
                            'Connection Error',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Unable to load messages. Please check your connection.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.4),
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: () => setState(() {}),
                            icon: const Icon(Icons.refresh),
                            label: const Text('Retry'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final messages = snapshot.data ?? [];
                
                if (messages.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.chat_bubble_outline, size: 64, color: AppColors.textSecondary),
                          const SizedBox(height: 16),
                          Text(
                            _isAdmin 
                              ? 'Start a conversation with this patient'
                              : 'Start a conversation with Dr. Fizza',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 16,
                              color: AppColors.textSecondary,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // Auto-scroll to bottom on new messages
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (_scrollController.hasClients) {
                    _scrollController.animateTo(
                      _scrollController.position.maxScrollExtent,
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOut,
                    );
                  }
                });

                return ListView.builder(
                  controller: _scrollController,
                  reverse: false,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[messages.length - 1 - index];
                    final isMe = message.senderId == _currentUserId;
                    final previousMessage = index > 0 ? messages[messages.length - index] : null;
                    final showTime = _shouldShowTimestamp(message, previousMessage);
                    
                    return Column(
                      children: [
                        if (showTime)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.7),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                _formatMessageTime(message.createdAt),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ),
                        ChatBubble(
                          message: message.text,
                          isUser: isMe,
                          time: _formatTime(message.createdAt),
                        ),
                      ],
                    );
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.textSecondary.withOpacity(0.1))),
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Attachment button
            IconButton(
              icon: const Icon(Icons.attach_file, color: AppColors.textSecondary),
              onPressed: () {
                // TODO: Implement attachment functionality
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Attachment feature coming soon!')),
                );
              },
            ),
            
            const SizedBox(width: 8),
            
            // Emoji button
            IconButton(
              icon: const Icon(Icons.emoji_emotions_outlined, color: AppColors.textSecondary),
              onPressed: () {
                // TODO: Implement emoji picker
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Emoji picker coming soon!')),
                );
              },
            ),
            
            const SizedBox(width: 8),
            
            // Message input
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: _messageController,
                  maxLines: null,
                  keyboardType: TextInputType.multiline,
                  textInputAction: TextInputAction.newline,
                  onSubmitted: (value) {
                    if (value.trim().isNotEmpty && !_isSending) {
                      _sendMessage();
                    }
                  },
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    hintStyle: TextStyle(color: AppColors.textSecondary),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                ),
              ),
            ),
            
            const SizedBox(width: 8),
            
            // Voice message button
            IconButton(
              icon: const Icon(Icons.mic, color: AppColors.textSecondary),
              onPressed: () {
                // TODO: Implement voice message functionality
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Voice messages coming soon!')),
                );
              },
            ),
            
            const SizedBox(width: 4),
            
            // Send button
            Container(
              decoration: BoxDecoration(
                color: _messageController.text.trim().isEmpty || _isSending 
                    ? AppColors.textSecondary.withOpacity(0.3) 
                    : AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: _isSending 
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send, color: Colors.white, size: 18),
                onPressed: _messageController.text.trim().isNotEmpty && !_isSending 
                    ? _sendMessage 
                    : null,
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _shouldShowTimestamp(ChatMessageModel current, ChatMessageModel? previous) {
    if (previous == null) return true;
    
    final currentDateTime = current.createdAt;
    final previousDateTime = previous.createdAt;
    
    if (currentDateTime == null || previousDateTime == null) return false;
    
    // Show timestamp if more than 5 minutes apart
    return currentDateTime.difference(previousDateTime).inMinutes > 5;
  }

  String _formatTime(DateTime? dateTime) {
    if (dateTime == null) return '';
    return DateFormat('h:mm a').format(dateTime);
  }

  String _formatMessageTime(DateTime? dateTime) {
    if (dateTime == null) return '';
    
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return DateFormat('EEEE').format(dateTime);
    } else {
      return DateFormat('MMM dd, yyyy').format(dateTime);
    }
  }
}
