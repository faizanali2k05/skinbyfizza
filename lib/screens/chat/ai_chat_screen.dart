import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../constants/colors.dart';
import '../../routes/app_routes.dart';
import '../../services/chat_service.dart';
import '../../services/faq_service.dart';

class AiChatScreen extends StatefulWidget {
  final bool initialIsAiMode;
  const AiChatScreen({super.key, this.initialIsAiMode = true});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  late bool _isAiMode;
  final TextEditingController _messageController = TextEditingController();
  final ChatService _chatService = ChatService();
  final FaqService _faqService = FaqService();
  
  @override
  void initState() {
    super.initState();
    _isAiMode = widget.initialIsAiMode;
    // Pre-load knowledge base and seed if necessary
    _faqService.fetchFaqs().then((_) {
        // Optional: Trigger seed if empty (for first run only)
        _faqService.seedInitialFaqs(); 
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  // --- Doctor Chat Logic (for Doctor Desk Mode) ---
  final FirebaseAuth _auth = FirebaseAuth.instance;
  String? _doctorConversationId;
  bool _doctorInitFailed = false;

  Future<void> _initializeDoctorConversation() async {
    final currentUser = _auth.currentUser;
    if (currentUser == null) return;

    setState(() {
      _doctorInitFailed = false;
    });

    try {
      final userDoc = await FirebaseFirestore.instance.collection('users').doc(currentUser.uid).get();
      final userName = userDoc.data()?['displayName'] ?? 'User';
      final email = currentUser.email ?? '';

      final conversationId = await _chatService.getOrCreateConversation(currentUser.uid, 'admin_uid'); // Updated to match new method signature
      if (mounted) {
        setState(() => _doctorConversationId = conversationId);
      }
    } catch (e) {
      print("Error init doctor convo: $e");
      if (mounted) {
        setState(() => _doctorInitFailed = true);
      }
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    
    _messageController.clear();

    if (_isAiMode) {
      // --- Smart Agent Mode (FAQ Based) ---
      // 1. Save User Message to Firestore
      final userSaved = await _chatService.sendAiMessage(text, true);
      if (!userSaved) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Unable to send your message. Please check your connection or permissions and try again.")));
        return;
      }

      // 2. Get Smart Response (Local)
      try {
        final response = await _faqService.getAnswer(text);

        // 3. Save Bot Response to Firestore
        final botSaved = await _chatService.sendAiMessage(response, false);
        if (!botSaved && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Response saved locally but couldn't be persisted to server.")));
      } catch (e) {
        print("Smart Agent Error: $e");
        final fallbackSaved = await _chatService.sendAiMessage("I'm having a bit of trouble accessing my knowledge base.", false);
        if (!fallbackSaved && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Could not save assistant reply. Please try again later.")));
      }

    } else {
      // --- Doctor Desk Mode (Real Chat) ---
      if (_doctorConversationId == null) {
          await _initializeDoctorConversation();
      }
      
      if (_doctorConversationId != null) {
         final currentUser = _auth.currentUser;
         if (currentUser == null) return;
         
         final userDoc = await FirebaseFirestore.instance.collection('users').doc(currentUser.uid).get();
         final userName = userDoc.data()?['displayName'] ?? 'User';

         try {
           await _chatService.sendMessage(
             conversationId: _doctorConversationId!,
             text: text, // Changed from 'message' to 'text'
             senderId: currentUser.uid,
             receiverId: 'admin_uid', // Changed from 'senderName' and 'isAdmin' to 'receiverId'
           );
         } catch(e) {
            if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error sending: $e")));
         }
      }
    }
  }

  String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour > 12 ? dateTime.hour - 12 : (dateTime.hour == 0 ? 12 : dateTime.hour);
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final period = dateTime.hour >= 12 ? 'PM' : 'AM';
    return "$hour:$minute $period";
  }

  @override
  Widget build(BuildContext context) {
    // Initialize doctor chat if switching to that mode
    if (!_isAiMode && _doctorConversationId == null) {
        _initializeDoctorConversation();
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pushNamedAndRemoveUntil(context, AppRoutes.home, (route) => false),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (!Navigator.canPop(context)) const SizedBox(height: 16),
            // Custom Toggle Switch
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _isAiMode = true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _isAiMode ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Text(
                          "AI Mode",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: _isAiMode ? Colors.white : Colors.black,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                         setState(() => _isAiMode = false);
                         _initializeDoctorConversation();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: !_isAiMode ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Text(
                          "Doctor Desk",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: !_isAiMode ? Colors.white : Colors.black,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Chat Area
            Expanded(
              child: _isAiMode 
              ? StreamBuilder<QuerySnapshot>(
                  stream: _chatService.getAiMessages(),
                  builder: (context, snapshot) {
                     if (snapshot.hasError) {
                       print('AI Chat Error: ${snapshot.error}');
                       return Center(child: Padding(
                         padding: const EdgeInsets.all(16.0),
                         child: Text('Unable to load messages. Please check your connection or sign-in status.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey[600])),
                       ));
                     }
                     if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

                     final docs = snapshot.data?.docs ?? [];
                     if (docs.isEmpty) {
                         return Center(
                           child: Padding(
                             padding: const EdgeInsets.all(32.0),
                              child: Text(
                                "Hello! I'm your SkinByFizza Assistant. Ask me about timings, treatments, or location!",
                               textAlign: TextAlign.center,
                               style: TextStyle(color: Colors.grey[600]),
                             ),
                           ),
                         );
                     }
                     return ListView.builder(
                       reverse: true,
                       padding: const EdgeInsets.all(20),
                       itemCount: docs.length,
                       itemBuilder: (context, index) {
                         final data = docs[index].data() as Map<String, dynamic>;
                         final timestamp = (data['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now();
                         return _buildMessageBubble(
                           data['message'] ?? '',
                           data['isUser'] ?? false,
                           _formatTime(timestamp),
                         );
                       },
                     );
                  }
              )
              : StreamBuilder<QuerySnapshot>(
                  stream: _doctorConversationId != null 
                    ? _chatService.getMessages(_doctorConversationId!)
                    : const Stream.empty(),
                  builder: (context, snapshot) {
                     if (_doctorConversationId == null) {
                       if (_doctorInitFailed) {
                         return Center(
                           child: Column(
                             mainAxisSize: MainAxisSize.min,
                             children: [
                               Text("Unable to initialize chat. Please check your connection or contact the clinic.", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey[600])),
                               const SizedBox(height: 12),
                               ElevatedButton(
                                 onPressed: () {
                                   setState(() {
                                     _doctorInitFailed = false;
                                   });
                                   _initializeDoctorConversation();
                                 },
                                 child: const Text("Retry"),
                               )
                             ],
                           ),
                         );
                       }

                       return const Center(child: CircularProgressIndicator());
                     }

                     if (snapshot.hasError) {
                       print('Doctor Chat Error: ${snapshot.error}');
                       return Center(child: Padding(
                         padding: const EdgeInsets.all(16.0),
                         child: Text('Unable to load messages. Please check your connection or report the issue.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey[600])),
                       ));
                     }

                     if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());

                     final docs = snapshot.data?.docs ?? [];
                     if (docs.isEmpty) {
                         return Center(
                           child: Padding(
                             padding: const EdgeInsets.all(32.0),
                             child: Text(
                               "Hello! Dr. G here. How can I help you today?",
                               textAlign: TextAlign.center,
                               style: TextStyle(color: Colors.grey[600]),
                             ),
                           ),
                         );
                     }
                     return ListView.builder(
                       reverse: true,
                       padding: const EdgeInsets.all(20),
                       itemCount: docs.length,
                       itemBuilder: (context, index) {
                         final data = docs[index].data() as Map<String, dynamic>;
                         final message = data['message'] ?? '';
                         final senderId = data['senderId'];
                         final timestamp = (data['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now();
                         final isUser = senderId == _auth.currentUser?.uid;
                         return _buildMessageBubble(
                           message,
                           isUser,
                           _formatTime(timestamp),
                         );
                       },
                     );
                  }
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
                        hintText: "Type your message...",
                        hintStyle: TextStyle(color: Colors.grey.shade400),
                        filled: true,
                        fillColor: AppColors.background,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(30),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: _sendMessage,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: AppColors.primaryLight,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.send, color: Colors.white, size: 20),
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

  Widget _buildMessageBubble(String message, bool isUser, String time) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Column(
        crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
             const Padding(
               padding: EdgeInsets.only(bottom: 8.0, left: 4.0),
               child: Icon(Icons.auto_awesome, size: 16, color: AppColors.primary),
             ),
          ],
          Container(
            constraints: const BoxConstraints(maxWidth: 280),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isUser ? AppColors.primary : Colors.white,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(20),
                topRight: const Radius.circular(20),
                bottomLeft: Radius.circular(isUser ? 20 : 4),
                bottomRight: Radius.circular(isUser ? 4 : 20),
              ),
              border: isUser ? null : Border.all(color: Colors.grey.shade200),
              boxShadow: isUser ? null : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 5,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              message,
              style: TextStyle(
                color: isUser ? Colors.white : AppColors.textPrimary,
                fontSize: 15,
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4.0),
            child: Text(
              time,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}