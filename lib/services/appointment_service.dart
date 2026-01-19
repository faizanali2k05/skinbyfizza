import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/appointment_model.dart';
import '../models/notification_model.dart';
import 'notification_service.dart';

class AppointmentService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Get current user ID
  String? get currentUserId => _auth.currentUser?.uid;

  // Stream of appointments for current user
  Stream<QuerySnapshot> getUserAppointments() {
    final uid = currentUserId;
    if (uid == null) return const Stream.empty();

    return _firestore
        .collection('appointments')
        .where('userId', isEqualTo: uid)
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  // Stream of all appointments (for admin)
  Stream<QuerySnapshot> getAllAppointments() {
    return _firestore
        .collection('appointments')
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  // Create new appointment
  Future<String> createAppointment({
    required String procedureId,
    required String procedureName,
    required String appointmentDate,
    required String appointmentTime,
    String doctorId = 'admin_uid', // Default admin ID, can be passed as parameter
  }) async {
    final uid = currentUserId;
    if (uid == null) throw Exception('User not logged in');

    final docRef = _firestore.collection('appointments').doc();
    
    final appointment = AppointmentModel(
      id: docRef.id,
      userId: uid,
      doctorId: doctorId,
      procedureId: procedureId,
      procedureName: procedureName,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      status: 'booked',
      createdAt: Timestamp.now(),
    );

    await docRef.set(appointment.toMap());

    // Create notification for appointment booking
    await NotificationService.createFirestoreNotification(
      userId: uid,
      title: 'Appointment Booked',
      message: 'Your appointment for $procedureName has been confirmed for $appointmentDate at $appointmentTime.',
      type: 'appointment',
      appointmentId: docRef.id,
    );

    return docRef.id;
  }

  // Update appointment status
  Future<void> updateAppointmentStatus({
    required String appointmentId,
    required String status,
  }) async {
    await _firestore.collection('appointments').doc(appointmentId).update({
      'status': status,
    });

    // Get appointment data to create notification
    final appointmentDoc = await _firestore.collection('appointments').doc(appointmentId).get();
    final appointmentData = appointmentDoc.data();
    if (appointmentData != null) {
      final userId = appointmentData['userId'];
      final procedureName = appointmentData['procedureName'];

      // Create notification for status update
      String title = '';
      String message = '';

      switch(status) {
        case 'completed':
          title = 'Appointment Completed';
          message = 'Your appointment for $procedureName has been completed.';
          break;
        case 'missed':
          title = 'Appointment Missed';
          message = 'Your appointment for $procedureName was marked as missed.';
          break;
        case 'cancelled':
          title = 'Appointment Cancelled';
          message = 'Your appointment for $procedureName has been cancelled.';
          break;
        default:
          return; // Don't create notification for other statuses
      }

      await NotificationService.createFirestoreNotification(
        userId: userId,
        title: title,
        message: message,
        type: 'appointment',
        appointmentId: appointmentId,
      );
    }
  }

  // Get single appointment
  Future<AppointmentModel?> getAppointment(String appointmentId) async {
    final doc = await _firestore.collection('appointments').doc(appointmentId).get();
    if (!doc.exists) return null;
    
    return AppointmentModel.fromMap(doc.data()!, doc.id);
  }

  // Get appointments for a specific doctor (admin)
  Stream<QuerySnapshot> getDoctorAppointments(String doctorId) {
    return _firestore
        .collection('appointments')
        .where('doctorId', isEqualTo: doctorId)
        .orderBy('createdAt', descending: true)
        .snapshots();
  }
}