import 'package:cloud_firestore/cloud_firestore.dart';

class SyncUtils {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Force refresh a collection by updating a timestamp field
  static Future<void> forceCollectionRefresh(String collectionPath) async {
    try {
      await _firestore.collection(collectionPath).limit(1).get();
      // Just accessing the collection triggers refresh in Firestore listeners
    } catch (e) {
      print('Error forcing collection refresh: $e');
    }
  }

  /// Force refresh a specific document by updating its timestamp
  static Future<void> forceDocumentRefresh(
      String collectionPath, String documentId) async {
    try {
      await _firestore
          .collection(collectionPath)
          .doc(documentId)
          .update({'updatedAt': FieldValue.serverTimestamp()});
    } catch (e) {
      print('Error forcing document refresh: $e');
    }
  }

  /// Wait for pending writes to complete
  static Future<void> waitForPendingWrites() async {
    try {
      await _firestore.waitForPendingWrites();
    } catch (e) {
      print('Error waiting for pending writes: $e');
    }
  }
}