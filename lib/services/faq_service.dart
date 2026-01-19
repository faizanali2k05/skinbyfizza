import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/faq_model.dart';

class FaqService {
  FirebaseFirestore? _firestore; // lazy, assigned only if needed
  
  // Cache FAQs in memory to avoid repeated reads
  List<FaqModel> _cachedFaqs = [];
  bool _isLoaded = false;

  // Allow injecting initial FAQs for tests (no Firestore required)
  // Also allow injecting a custom Firestore instance for testability
  FaqService({List<FaqModel>? initialFaqs, FirebaseFirestore? firestore}) {
    _firestore = firestore;
    if (initialFaqs != null) {
      _cachedFaqs = initialFaqs;
      _isLoaded = true;
    }
  }

  /// Built-in fallback FAQs used when Firestore is unavailable or rules block reads.
  List<FaqModel> get _fallbackFaqs {
    final initialFaqs = [
      {
        'keywords': ['time', 'timing', 'open', 'close', 'hours', 'schedule', 'when'],
        'answer': 'SkinByFizza is open Monday to Saturday from 11:00 AM to 8:00 PM. We are closed on Sundays.',
        'category': 'info'
      },
      {
        'keywords': ['location', 'address', 'where', 'place', 'located'],
        'answer': 'We are located at 12-C, Lane 4, DHA Phase 6, Karachi.',
        'category': 'info'
      },
      {
        'keywords': ['appointment', 'book', 'booking', 'schedule', 'visit', 'consultation'],
        'answer': 'Appointments are required! You can book a consultation directly through this app by going to the Home screen and clicking "Book Appointment".',
        'category': 'services'
      },
      {
        'keywords': ['price', 'cost', 'charges', 'fee', 'how much'],
        'answer': 'Consultation fee is PKR 3000. Procedure prices vary depending on the treatment. Please visit the "Procedures" section in the app for details.',
        'category': 'services'
      },
      {
        'keywords': ['services', 'treatments', 'facia', 'laser', 'acne', 'whitening', 'prp'],
        'answer': 'We offer a wide range of services including HydraFacial, Laser Hair Removal, PRP, Acne Scars Treatment, Skin Whitening Drips, and Botox/Fillers.',
        'category': 'services'
      },
      {
        'keywords': ['contact', 'phone', 'number', 'call', 'whatsapp'],
        'answer': 'You can reach us at 0300-1234567 or 021-35345678.',
        'category': 'info'
      },
      {
        'keywords': ['dr', 'doctor', 'fizza'],
        'answer': 'Dr. Fizza is our lead consultant dermatologist with over 8 years of experience in aesthetic medicine.',
        'category': 'info'
      }
    ];

    return initialFaqs.map((m) => FaqModel.fromMap(m, '')).toList();
  }

  /// Fetches all FAQs from Firestore and caches them.
  Future<void> fetchFaqs() async {
    try {
      final fs = _firestore ?? FirebaseFirestore.instance;
      final snapshot = await fs.collection('faqs').get();
      _cachedFaqs = snapshot.docs.map((doc) {
        return FaqModel.fromMap(doc.data(), doc.id);
      }).toList();
      _isLoaded = true;
      print("FaqService: Loaded ${_cachedFaqs.length} FAQs.");
    } catch (e) {
      print("FaqService Error fetching FAQs: $e");
      // Fallback to built-in knowledge base so AI Mode still works without Firestore access
      _cachedFaqs = _fallbackFaqs;
      _isLoaded = true;
      print("FaqService: Using fallback local FAQs (${_cachedFaqs.length}).");
    }
  }

  /// Finds the best matching answer for the user's message.
  /// Returns a default message if no match is found.
  Future<String> getAnswer(String message) async {
    if (!_isLoaded) {
      await fetchFaqs();
    }

    if (_cachedFaqs.isEmpty) {
      return "I'm currently unable to access my knowledge base. Please try again later.";
    }

    final lowerMsg = message.toLowerCase();

    // specific check for greetings
    if (['hi', 'hello', 'hey', 'greetings', 'salam'].any((w) => lowerMsg.contains(w))) {
       return "Hello! I'm the SkinByFizza virtual assistant. How can I help you today?";
    }

    // Keyword matching logic
    // We look for the FAQ with the MOST matching keywords, or simply the first match.
    // Let's try to find an FAQ where ANY of its keywords exist in the message.
    
    for (var faq in _cachedFaqs) {
      // Check if any keyword matches
      for (var keyword in faq.keywords) {
        if (lowerMsg.contains(keyword.toLowerCase())) {
          return faq.answer;
        }
      }
    }

    return "Sorry, I don't have this information right now. Please contact the clinic.";
  }

  /// Seeds the database with initial data if empty.
  /// Call this once from Admin panel or during app initialization if needed.
  Future<void> seedInitialFaqs() async {
    try {
      final fs = _firestore ?? FirebaseFirestore.instance;
      final snapshot = await fs.collection('faqs').limit(1).get();
      if (snapshot.docs.isNotEmpty) {
        print("FaqService: Database already seeded.");
        return;
      }

      print("FaqService: Seeding initial FAQs...");
      
      final initialFaqs = [
        {
          'keywords': ['time', 'timing', 'open', 'close', 'hours', 'schedule', 'when'],
          'answer': 'SkinByFizza is open Monday to Saturday from 11:00 AM to 8:00 PM. We are closed on Sundays.',
          'category': 'info'
        },
        {
          'keywords': ['location', 'address', 'where', 'place', 'located'],
          'answer': 'We are located at 12-C, Lane 4, DHA Phase 6, Karachi.',
          'category': 'info'
        },
        {
          'keywords': ['appointment', 'book', 'booking', 'schedule', 'visit', 'consultation'],
          'answer': 'Appointments are required! You can book a consultation directly through this app by going to the Home screen and clicking "Book Appointment".',
          'category': 'services'
        },
        {
          'keywords': ['price', 'cost', 'charges', 'fee', 'how much'],
          'answer': 'Consultation fee is PKR 3000. Procedure prices vary depending on the treatment. Please visit the "Procedures" section in the app for details.',
          'category': 'services'
        },
        {
          'keywords': ['services', 'treatments', 'facia', 'laser', 'acne', 'whitening', 'prp'],
          'answer': 'We offer a wide range of services including HydraFacial, Laser Hair Removal, PRP, Acne Scars Treatment, Skin Whitening Drips, and Botox/Fillers.',
          'category': 'services'
        },
        {
          'keywords': ['contact', 'phone', 'number', 'call', 'whatsapp'],
          'answer': 'You can reach us at 0300-1234567 or 021-35345678.',
          'category': 'info'
        },
        {
          'keywords': ['dr', 'doctor', 'fizza'],
          'answer': 'Dr. Fizza is our lead consultant dermatologist with over 8 years of experience in aesthetic medicine.',
          'category': 'info'
        }
      ];

      final batch = fs.batch();
      for (var faq in initialFaqs) {
        final docRef = fs.collection('faqs').doc();
        batch.set(docRef, faq);
      }
      await batch.commit();
      print("FaqService: Seeding complete.");
    } catch (e) {
      // Do not throw if seeding fails (e.g., permission-denied on Spark plan or strict rules)
      print("FaqService: Seed skipped or failed: $e");
    }
  }
}
