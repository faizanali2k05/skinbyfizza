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
        description: 'Deep cleansing facial treatment with exfoliation and hydration',
        price: 80.0,
        category: 'Facial',
      ),
      ProcedureModel(
        id: '',
        title: 'Botox Injection',
        description: 'Anti-wrinkle injection to smooth facial lines',
        price: 350.0,
        category: 'Injectables',
      ),
      ProcedureModel(
        id: '',
        title: 'Chemical Peel',
        description: 'Chemical solution to improve skin texture and appearance',
        price: 120.0,
        category: 'Peel',
      ),
      ProcedureModel(
        id: '',
        title: 'Laser Hair Removal',
        description: 'Laser treatment for permanent hair reduction',
        price: 150.0,
        category: 'Laser',
      ),
    ];

    for (final procedure in sampleProcedures) {
      await _firestore.collection('procedures').add(procedure.toMap());
    }
  }

  // Only show messages about data population if needed
  print('Firestore ready - displaying actual data from collections');
}
