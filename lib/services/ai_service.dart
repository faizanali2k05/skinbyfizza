import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/faq_model.dart';

/// AI Service for Smart Assistant (No External APIs)
/// 
/// This service handles all AI-like functionality purely through:
/// 1. Firestore FAQ data with keyword matching
/// 2. Local fallback knowledge base
/// 3. No external API calls (Spark Plan compatible)
class AiService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Cache FAQs locally to reduce Firestore reads
  List<FaqModel> _cachedFaqs = [];
  bool _isLoaded = false;

  /// Fetch all FAQs from Firestore and cache them
  Future<void> loadFaqs() async {
    if (_isLoaded) return; // Already loaded

    try {
      final snapshot = await _firestore.collection('faqs').get();
      _cachedFaqs = snapshot.docs
          .map((doc) => FaqModel.fromMap(doc.data(), doc.id))
          .toList();
      _isLoaded = true;
      print('AI Service: Loaded ${_cachedFaqs.length} FAQs');
    } catch (e) {
      print('AI Service: Error loading FAQs: $e');
      _isLoaded = false;
      // Fallback will be used in getResponse
    }
  }

  /// Get smart response based on user query
  /// Uses keyword matching against FAQ keywords
  Future<String> getResponse(String userMessage) async {
    // Ensure FAQs are loaded
    if (!_isLoaded) {
      await loadFaqs();
    }

    if (_cachedFaqs.isEmpty) {
      return "I'm currently unable to access my knowledge base. Please try again later.";
    }

    final lowerMessage = userMessage.toLowerCase().trim();

    // Check for greetings first
    if (['hi', 'hello', 'hey', 'greetings', 'salam', 'salaam', 'hola']
        .any((greeting) => lowerMessage.contains(greeting))) {
      return "Hello! 👋 I'm the SkinByFizza virtual assistant. How can I help you today? Feel free to ask about our services, pricing, location, or anything else!";
    }

    // Find the best matching FAQ
    FaqModel? bestMatch;
    int bestMatchCount = 0;

    for (final faq in _cachedFaqs) {
      int matchCount = 0;
      for (final keyword in faq.keywords) {
        if (lowerMessage.contains(keyword.toLowerCase())) {
          matchCount++;
        }
      }

      // Update best match if this FAQ has more keyword hits
      if (matchCount > bestMatchCount) {
        bestMatch = faq;
        bestMatchCount = matchCount;
      }
    }

    // Return match if found
    if (bestMatch != null && bestMatchCount > 0) {
      return bestMatch.answer;
    }

    // No match found - return helpful fallback
    return "I don't have specific information about that right now. However, you can:\n\n"
        "📞 Call us: 0300-1234567 or 021-35345678\n"
        "📍 Visit us: 12-C, Lane 4, DHA Phase 6, Karachi\n"
        "⏰ Hours: Mon-Sat, 11 AM - 8 PM (Closed Sundays)\n\n"
        "Our team will be happy to help!";
  }

  /// Get all available FAQs (for admin or info screen)
  Future<List<FaqModel>> getAllFaqs() async {
    if (!_isLoaded) {
      await loadFaqs();
    }
    return _cachedFaqs;
  }

  /// Add a new FAQ to Firestore (admin only)
  Future<String> addFaq({
    required List<String> keywords,
    required String answer,
    required String category,
  }) async {
    try {
      final docRef = _firestore.collection('faqs').doc();
      await docRef.set({
        'keywords': keywords,
        'answer': answer,
        'category': category,
      });

      // Invalidate cache so it reloads next time
      _isLoaded = false;
      return docRef.id;
    } catch (e) {
      print('Error adding FAQ: $e');
      rethrow;
    }
  }

  /// Update an existing FAQ (admin only)
  Future<void> updateFaq({
    required String faqId,
    required List<String> keywords,
    required String answer,
    required String category,
  }) async {
    try {
      await _firestore.collection('faqs').doc(faqId).update({
        'keywords': keywords,
        'answer': answer,
        'category': category,
      });

      // Invalidate cache
      _isLoaded = false;
    } catch (e) {
      print('Error updating FAQ: $e');
      rethrow;
    }
  }

  /// Delete an FAQ (admin only)
  Future<void> deleteFaq(String faqId) async {
    try {
      await _firestore.collection('faqs').doc(faqId).delete();
      _isLoaded = false;
    } catch (e) {
      print('Error deleting FAQ: $e');
      rethrow;
    }
  }

  /// Clear local cache (useful for testing or admin refresh)
  void clearCache() {
    _cachedFaqs.clear();
    _isLoaded = false;
  }
}
