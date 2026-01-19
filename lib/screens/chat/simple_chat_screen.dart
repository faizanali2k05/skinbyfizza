import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../constants/colors.dart';
import '../../services/chat_service.dart';
import '../../services/faq_service.dart';

class SimpleChatScreen extends StatefulWidget {
  const SimpleChatScreen({super.key});

  @override
  State<SimpleChatScreen> createState() => _SimpleChatScreenState();
}

class _SimpleChatScreenState extends State<SimpleChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ChatService _chatService = ChatService();
  final FaqService _faqService = FaqService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  
  bool _isAiMode = true;
  String? _conversationId;
  bool _isLoading = false;
  bool _initError = false;

  @override
  void initState() {
    super.initState();
    _initializeAI();
    _initializeDoctorChat();
  }

  Future<void> _initializeAI() async {
    try {
      await _faqService.fetchFaqs();
      await _faqService.seedInitialFaqs();
    } catch (e) {
      print('AI Init Error: $e');
    }
  }

  Future<void> _initializeDoctorChat() async {
    try {
      final user = _auth.currentUser;
      if (user == null) {
        setState(() => _initError = true);
        return;
      }

      final convId = await _chatService.getOrCreateConversation(user.uid, 'admin_uid');
      if (mounted) {
        setState(() {
          _conversationId = convId;
          _initError = false;
        });
      }
    } catch (e) {
      print('Doctor Chat Init Error: $e');
      if (mounted) {
        setState(() => _initError = true);
      }
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    setState(() => _isLoading = true);

    try {
      if (_isAiMode) {
        // Send user message
        await _chatService.sendAiMessage(text, true);

        // Get AI response
        final response = await _faqService.getAnswer(text);
        
        // Send AI response
        await _chatService.sendAiMessage(response, false);
      } else {
        // Doctor chat
        final user = _auth.currentUser;
        if (user != null && _conversationId != null) {
          await _chatService.sendMessage(
            conversationId: _conversationId!,
            text: text,
            senderId: user.uid,
            receiverId: 'admin_uid',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildMessageBubble(String message, bool isUser) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 0),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isUser ? AppColors.primary : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(12),
        ),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Text(
          message,
          style: TextStyle(
            color: isUser ? Colors.white : Colors.black87,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_isAiMode ? 'AI Assistant' : 'Doctor Chat', 
          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Center(
              child: SegmentedButton<bool>(
                segments: const [
                  ButtonSegment(label: Text('AI'), value: true),
                  ButtonSegment(label: Text('Doctor'), value: false),
                ],
                selected: {_isAiMode},
                onSelectionChanged: (value) {
                  setState(() => _isAiMode = value.first);
                },
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Messages Area
            Expanded(
              child: _isAiMode
                ? StreamBuilder<QuerySnapshot>(
                    stream: _chatService.getAiMessages(),
                    builder: (context, snapshot) {
                      if (snapshot.hasError) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Text(
                              'Unable to load messages: ${snapshot.error}',
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: Colors.red),
                            ),
                          ),
                        );
                      }

                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(child: CircularProgressIndicator());
                      }

                      final messages = snapshot.data?.docs ?? [];
                      
                      if (messages.isEmpty) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32.0),
                            child: Text(
                              "Hello! I'm your SkinByFizza AI Assistant.\nAsk me about our services, pricing, or location!",
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.grey[600], fontSize: 16),
                            ),
                          ),
                        );
                      }

                      return ListView.builder(
                        reverse: true,
                        padding: const EdgeInsets.all(16),
                        itemCount: messages.length,
                        itemBuilder: (context, index) {
                          final data = messages[index].data() as Map<String, dynamic>;
                          return _buildMessageBubble(
                            data['message'] ?? '',
                            data['isUser'] ?? false,
                          );
                        },
                      );
                    },
                  )
                : StreamBuilder<QuerySnapshot>(
                    stream: _conversationId != null 
                      ? _chatService.getMessages(_conversationId!)
                      : const Stream.empty(),
                    builder: (context, snapshot) {
                      if (_initError) {
                        return Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text('Unable to load chat. Please try again.'),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _initializeDoctorChat,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        );
                      }

                      if (_conversationId == null) {
                        return const Center(child: CircularProgressIndicator());
                      }

                      if (snapshot.hasError) {
                        return Center(
                          child: Text('Error: ${snapshot.error}'),
                        );
                      }

                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(child: CircularProgressIndicator());
                      }

                      final messages = snapshot.data?.docs ?? [];

                      if (messages.isEmpty) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32.0),
                            child: Text(
                              'No messages yet. Start a conversation!',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.grey[600], fontSize: 16),
                            ),
                          ),
                        );
                      }

                      return ListView.builder(
                        reverse: true,
                        padding: const EdgeInsets.all(16),
                        itemCount: messages.length,
                        itemBuilder: (context, index) {
                          final data = messages[index].data() as Map<String, dynamic>;
                          final isCurrentUserSender = 
                            data['senderId'] == _auth.currentUser?.uid;
                          return _buildMessageBubble(
                            data['text'] ?? '',
                            isCurrentUserSender,
                          );
                        },
                      );
                    },
                  ),
            ),

            // Input Area
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Colors.grey.shade200)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
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
                      enabled: !_isLoading,
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: AppColors.primary,
                    child: IconButton(
                      icon: _isLoading 
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Icon(Icons.send, color: Colors.white),
                      onPressed: _isLoading ? null : _sendMessage,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
