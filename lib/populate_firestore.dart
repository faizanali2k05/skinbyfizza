import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'models/user_model.dart';
import 'models/procedure_model.dart';
import 'models/appointment_model.dart';
import 'models/notification_model.dart';

void populateFirestore() async {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Check if collections have any data before populating
  final proceduresSnapshot = await _firestore.collection('procedures').limit(1).get();
  if (proceduresSnapshot.docs.isEmpty) {
    final sampleProcedures = [
      ProcedureModel(
        id: '',
        title: 'Facial Treatment',
        name: 'Facial Treatment',
        description: 'Deep cleansing facial treatment with exfoliation and hydration',
        category: 'Facial',
        price: 80.0,
        sessions: 1,
        visitsPerSession: 1,
        keyFeatures: const ['Cleansing', 'Exfoliation', 'Hydration'],
      ),
      ProcedureModel(
        id: '',
        title: 'Botox Injection',
        name: 'Botox Injection',
        description: 'Anti-wrinkle injection to smooth facial lines',
        category: 'Injectables',
        price: 350.0,
        sessions: 3,
        visitsPerSession: 1,
        keyFeatures: const ['Anti-wrinkle', 'Smooth', 'Natural'],
      ),
      ProcedureModel(
        id: '',
        title: 'Chemical Peel',
        name: 'Chemical Peel',
        description: 'Chemical solution to improve skin texture and appearance',
        category: 'Peel',
        price: 120.0,
        sessions: 4,
        visitsPerSession: 2,
        keyFeatures: const ['Brightening', 'Texture', 'Rejuvenation'],
      ),
      ProcedureModel(
        id: '',
        title: 'Laser Hair Removal',
        name: 'Laser Hair Removal',
        description: 'Laser treatment for permanent hair reduction',
        category: 'Laser',
        price: 150.0,
        sessions: 6,
        visitsPerSession: 1,
        keyFeatures: const ['Permanent', 'Safe', 'Effective'],
      ),
    ];

    for (final procedure in sampleProcedures) {
      await _firestore.collection('procedures').add(procedure.toMap());
    }
  }

  // Only show messages about data population if needed
  print('Firestore ready - displaying actual data from collections');
}
