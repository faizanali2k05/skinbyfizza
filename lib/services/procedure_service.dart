import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../models/procedure_model.dart';

/// Procedure Service for managing beauty/dermatology procedures
/// Handles reading, caching, and admin management of procedures
class ProcedureService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // ==================== Real-time Streams ======================

  /// Get all procedures (real-time, public read)
  /// Sorted by name alphabetically
  Stream<List<ProcedureModel>> getAllProceduresStream() {
    return _firestore
        .collection('procedures')
        .orderBy('name', descending: false)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => ProcedureModel.fromSnapshot(doc))
            .toList())
        .handleError((error) {
          debugPrint('Get procedures error: $error');
          return <ProcedureModel>[];
        });
  }

  // ==================== Single Fetches ======================

  /// Get all procedures (single fetch, not real-time)
  Future<List<ProcedureModel>> getAllProcedures() async {
    try {
      final snapshot = await _firestore
          .collection('procedures')
          .orderBy('name', descending: false)
          .get();

      return snapshot.docs
          .map((doc) => ProcedureModel.fromSnapshot(doc))
          .toList();
    } catch (e) {
      debugPrint('Error fetching procedures: $e');
      return [];
    }
  }

  /// Get procedure by ID
  Future<ProcedureModel?> getProcedureById(String procedureId) async {
    try {
      final doc = await _firestore
          .collection('procedures')
          .doc(procedureId)
          .get();

      if (!doc.exists) return null;
      return ProcedureModel.fromSnapshot(doc);
    } catch (e) {
      debugPrint('Error fetching procedure: $e');
      return null;
    }
  }

  /// Search procedures by name
  Future<List<ProcedureModel>> searchProcedures(String query) async {
    try {
      if (query.isEmpty) {
        return getAllProcedures();
      }

      final normalizedQuery = query.toLowerCase();
      final all = await getAllProcedures();

      return all
          .where((p) => p.name.toLowerCase().contains(normalizedQuery))
          .toList();
    } catch (e) {
      debugPrint('Error searching procedures: $e');
      return [];
    }
  }

  // ==================== Admin: Create/Update/Delete ======================

  /// Create new procedure (admin only)
  /// Validates required fields before creating
  Future<String?> createProcedure({
    required String name,
    required String description,
    required int duration, // in minutes
    required double price,
    String? imageUrl,
  }) async {
    try {
      if (name.trim().isEmpty) return 'Procedure name is required.';
      if (description.trim().isEmpty) return 'Description is required.';
      if (duration <= 0) return 'Duration must be greater than 0.';
      if (price < 0) return 'Price cannot be negative.';

      final procedure = ProcedureModel(
        id: '',
        title: name.trim(),
        name: name.trim(),
        description: description.trim(),
        category: 'GENERAL',
        duration: duration,
        sessions: 1,
        visitsPerSession: 1,
        keyFeatures: const [],
        price: price,
        imageUrl: imageUrl ?? '',
      );

      final docRef = await _firestore
          .collection('procedures')
          .add(procedure.toMap());

      debugPrint('Created procedure: ${docRef.id}');
      return null; // Success
    } catch (e) {
      return 'Error creating procedure: $e';
    }
  }

  /// Update procedure (admin only)
  Future<String?> updateProcedure(
    String procedureId, {
    String? name,
    String? description,
    int? duration,
    double? price,
    String? imageUrl,
  }) async {
    try {
      final updates = <String, dynamic>{};

      if (name != null && name.trim().isNotEmpty) {
        updates['name'] = name.trim();
      }
      if (description != null && description.trim().isNotEmpty) {
        updates['description'] = description.trim();
      }
      if (duration != null && duration > 0) {
        updates['duration'] = duration;
      }
      if (price != null && price >= 0) {
        updates['price'] = price;
      }
      if (imageUrl != null) {
        updates['imageUrl'] = imageUrl;
      }

      if (updates.isEmpty) {
        return 'No fields to update.';
      }

      updates['updatedAt'] = FieldValue.serverTimestamp();

      await _firestore
          .collection('procedures')
          .doc(procedureId)
          .update(updates);

      debugPrint('Updated procedure: $procedureId');
      return null; // Success
    } catch (e) {
      return 'Error updating procedure: $e';
    }
  }

  /// Delete procedure (admin only)
  Future<String?> deleteProcedure(String procedureId) async {
    try {
      await _firestore
          .collection('procedures')
          .doc(procedureId)
          .delete();

      debugPrint('Deleted procedure: $procedureId');
      return null; // Success
    } catch (e) {
      return 'Error deleting procedure: $e';
    }
  }

  // ==================== Utility Methods ======================

  /// Get procedures by duration (filter examples)
  Future<List<ProcedureModel>> getProceduresByDuration(int maxDuration) async {
    try {
      final all = await getAllProcedures();
      return all.where((p) => p.duration <= maxDuration).toList();
    } catch (e) {
      debugPrint('Error filtering by duration: $e');
      return [];
    }
  }

  /// Get procedures within price range
  Future<List<ProcedureModel>> getProceduresByPriceRange(
    double minPrice,
    double maxPrice,
  ) async {
    try {
      final all = await getAllProcedures();
      return all
          .where((p) => p.price >= minPrice && p.price <= maxPrice)
          .toList();
    } catch (e) {
      debugPrint('Error filtering by price: $e');
      return [];
    }
  }

  // ==================== Backward Compatibility ======================

  /// Deprecated: Use getAllProcedures instead
  @Deprecated('Use getAllProcedures instead')
  Future<List<ProcedureModel>> getProcedures() {
    return getAllProcedures();
  }

  /// Deprecated: Use getAllProceduresStream instead
  @Deprecated('Use getAllProceduresStream instead')
  Stream<QuerySnapshot> getProceduresStream() {
    return _firestore.collection('procedures').snapshots();
  }

  /// Deprecated: Use getProcedureById instead
  @Deprecated('Use getProcedureById instead')
  Future<ProcedureModel?> getProcedure(String procedureId) {
    return getProcedureById(procedureId);
  }

  /// Deprecated: Use updateProcedure with named parameters instead
  @Deprecated('Use updateProcedure with named parameters instead')
  Future<void> updateProcedureOld(String procedureId, ProcedureModel procedure) async {
    try {
      await _firestore.collection('procedures').doc(procedureId).update(procedure.toMap());
    } catch (e) {
      debugPrint('Error updating procedure: $e');
      rethrow;
    }
  }
}