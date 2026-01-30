import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../models/appointment_model.dart';
import '../models/notification_model.dart';

/// Appointment Service for booking, viewing, and managing appointments
/// Handles real-time streams and notification creation
class AppointmentService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String? get currentUserId => _auth.currentUser?.uid;

  // ==================== User Appointments (Real-time) ======================

  /// Stream of current user's appointments (real-time)
  /// Ordered by date descending (newest first)
  Stream<List<AppointmentModel>> getUserAppointmentsStream() {
    final uid = currentUserId;
    if (uid == null) return Stream.value([]);

    return _firestore
        .collection('appointments')
        .where('userId', isEqualTo: uid)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => AppointmentModel.fromSnapshot(doc))
            .toList())
        .handleError((error) {
          debugPrint('Get user appointments error: $error');
          return <AppointmentModel>[];
        });
  }

  /// Get single appointment by ID
  Future<AppointmentModel?> getAppointmentById(String appointmentId) async {
    try {
      final doc = await _firestore
          .collection('appointments')
          .doc(appointmentId)
          .get();

      if (!doc.exists) return null;
      return AppointmentModel.fromSnapshot(doc);
    } catch (e) {
      debugPrint('Get appointment by ID error: $e');
      return null;
    }
  }

  // ==================== Book Appointment ======================

  /// Book new appointment
  /// Returns appointment ID on success
  Future<String?> bookAppointment({
    required String procedureId,
    required String procedureName,
    required String appointmentDate, // YYYY-MM-DD
    required String appointmentTime, // HH:mm
    String notes = '',
  }) async {
    try {
      final uid = currentUserId;
      if (uid == null) return 'User not authenticated.';

      final appointment = AppointmentModel(
        id: '', // Firestore will generate ID
        userId: uid,
        procedureId: procedureId,
        procedureName: procedureName,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        status: 'booked',
        notes: notes,
      );

      final docRef = await _firestore
          .collection('appointments')
          .add(appointment.toMap());

      // Create notification for appointment booking
      final notification = NotificationModel(
        id: '', // Firestore will generate ID
        userId: uid,
        title: 'Appointment Booked',
        message:
            'Your $procedureName appointment is booked for $appointmentDate at $appointmentTime',
        type: 'appointment',
        appointmentId: docRef.id,
      );

      await _firestore
          .collection('notifications')
          .add(notification.toMap());

      return null; // Success
    } catch (e) {
      return 'Error booking appointment: $e';
    }
  }

  // ==================== Admin: View All Appointments ======================

  /// Stream of all appointments (admin only)
  /// Ordered by date descending (newest first)
  Stream<List<AppointmentModel>> getAllAppointmentsStream() {
    return _firestore
        .collection('appointments')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => AppointmentModel.fromSnapshot(doc))
            .toList())
        .handleError((error) {
          debugPrint('Get all appointments error: $error');
          return <AppointmentModel>[];
        });
  }

  /// Get appointments by status (admin)
  Stream<List<AppointmentModel>> getAppointmentsByStatusStream(String status) {
    return _firestore
        .collection('appointments')
        .where('status', isEqualTo: status)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => AppointmentModel.fromSnapshot(doc))
            .toList())
        .handleError((error) {
          debugPrint('Get appointments by status error: $error');
          return <AppointmentModel>[];
        });
  }

  // ==================== Admin: Update Appointment ======================

  /// Update appointment status (admin only)
  /// Returns null on success, or error message on failure
  Future<String?> updateAppointmentStatus({
    required String appointmentId,
    required String status,
    String adminNotes = '',
  }) async {
    try {
      // Get current appointment data
      final appointmentDoc = await getAppointmentById(appointmentId);
      if (appointmentDoc == null) return 'Appointment not found.';

      // Update appointment document
      await _firestore
          .collection('appointments')
          .doc(appointmentId)
          .update({
            'status': status,
            'adminNotes': adminNotes,
            'updatedAt': FieldValue.serverTimestamp(),
          });

      // Create notification for user about status update
      final notification = NotificationModel(
        id: '',
        userId: appointmentDoc.userId,
        title: 'Appointment Updated',
        message:
            'Your appointment status has been updated to: ${status.toUpperCase()}',
        type: 'status_update',
        appointmentId: appointmentId,
      );

      await _firestore
          .collection('notifications')
          .add(notification.toMap());

      return null; // Success
    } catch (e) {
      return 'Error updating appointment: $e';
    }
  }

  /// Update appointment user notes
  Future<String?> updateAppointmentNotes({
    required String appointmentId,
    required String notes,
  }) async {
    try {
      await _firestore
          .collection('appointments')
          .doc(appointmentId)
          .update({
            'notes': notes,
            'updatedAt': FieldValue.serverTimestamp(),
          });
      return null; // Success
    } catch (e) {
      return 'Error updating notes: $e';
    }
  }

  // ==================== Cancel Appointment ======================

  /// Cancel appointment (user or admin)
  /// Returns null on success, error message on failure
  Future<String?> cancelAppointment(String appointmentId) async {
    try {
      final appointment = await getAppointmentById(appointmentId);
      if (appointment == null) return 'Appointment not found.';

      await _firestore
          .collection('appointments')
          .doc(appointmentId)
          .update({
            'status': 'cancelled',
            'updatedAt': FieldValue.serverTimestamp(),
          });

      // Create notification
      final notification = NotificationModel(
        id: '',
        userId: appointment.userId,
        title: 'Appointment Cancelled',
        message: 'Your ${appointment.procedureName} appointment has been cancelled',
        type: 'status_update',
        appointmentId: appointmentId,
      );

      await _firestore
          .collection('notifications')
          .add(notification.toMap());

      return null; // Success
    } catch (e) {
      return 'Error cancelling appointment: $e';
    }
  }

  // ==================== Delete (admin/testing) ======================

  /// Delete appointment document (admin only)
  Future<String?> deleteAppointment(String appointmentId) async {
    try {
      await _firestore
          .collection('appointments')
          .doc(appointmentId)
          .delete();
      return null; // Success
    } catch (e) {
      return 'Error deleting appointment: $e';
    }
  }

  /// Get all appointments (admin only)
  Future<List<AppointmentModel>> getAllAppointments() async {
    try {
      final snapshot = await _firestore
          .collection('appointments')
          .orderBy('createdAt', descending: true)
          .get();
      return snapshot.docs
          .map((doc) => AppointmentModel.fromSnapshot(doc))
          .toList();
    } catch (e) {
      debugPrint('Get all appointments error: $e');
      return [];
    }
  }

  /// Get user appointments (non-streaming version)
  Future<List<AppointmentModel>> getUserAppointments(String userId) async {
    try {
      final snapshot = await _firestore
          .collection('appointments')
          .where('userId', isEqualTo: userId)
          .orderBy('createdAt', descending: true)
          .get();
      return snapshot.docs
          .map((doc) => AppointmentModel.fromSnapshot(doc))
          .toList();
    } catch (e) {
      debugPrint('Get user appointments error: $e');
      return [];
    }
  }

  /// Create appointment (alias for bookAppointment)
  Future<String?> createAppointment({
    required String procedureId,
    required String procedureName,
    required String appointmentDate,
    required String appointmentTime,
    String notes = '',
  }) =>
      bookAppointment(
        procedureId: procedureId,
        procedureName: procedureName,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        notes: notes,
      );

  /// Get appointment (alias for getAppointmentById)
  Future<AppointmentModel?> getAppointment(String appointmentId) =>
      getAppointmentById(appointmentId);
}