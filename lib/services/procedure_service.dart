import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/procedure_model.dart';

class ProcedureService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Get all procedures
  Future<List<ProcedureModel>> getProcedures() async {
    try {
      final snapshot = await _firestore.collection('procedures').get();
      return snapshot.docs
          .map((doc) => ProcedureModel.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      print('Error fetching procedures: $e');
      return [];
    }
  }

  // Get procedures stream
  Stream<QuerySnapshot> getProceduresStream() {
    return _firestore.collection('procedures').snapshots();
  }

  // Get single procedure
  Future<ProcedureModel?> getProcedure(String procedureId) async {
    try {
      final doc = await _firestore.collection('procedures').doc(procedureId).get();
      if (!doc.exists) return null;
      return ProcedureModel.fromMap(doc.data()!, doc.id);
    } catch (e) {
      print('Error fetching procedure: $e');
      return null;
    }
  }

  // Get procedures by category
  Future<List<ProcedureModel>> getProceduresByCategory(String category) async {
    try {
      final snapshot = await _firestore
          .collection('procedures')
          .where('category', isEqualTo: category)
          .get();
      return snapshot.docs
          .map((doc) => ProcedureModel.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      print('Error fetching procedures by category: $e');
      return [];
    }
  }

  // Add procedure (admin only)
  Future<String> addProcedure(ProcedureModel procedure) async {
    try {
      final docRef = _firestore.collection('procedures').doc();
      await docRef.set(procedure.toMap());
      return docRef.id;
    } catch (e) {
      print('Error adding procedure: $e');
      rethrow;
    }
  }

  // Update procedure (admin only)
  Future<void> updateProcedure(String procedureId, ProcedureModel procedure) async {
    try {
      await _firestore.collection('procedures').doc(procedureId).update(procedure.toMap());
    } catch (e) {
      print('Error updating procedure: $e');
      rethrow;
    }
  }

  // Delete procedure (admin only)
  Future<void> deleteProcedure(String procedureId) async {
    try {
      await _firestore.collection('procedures').doc(procedureId).delete();
    } catch (e) {
      print('Error deleting procedure: $e');
      rethrow;
    }
  }
}