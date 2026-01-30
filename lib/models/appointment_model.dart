import 'package:cloud_firestore/cloud_firestore.dart';

class AppointmentModel {
  final String id;
  final String userId;
  final String doctorId;
  final String procedureId;
  final String procedureName;
  final String appointmentDate; // YYYY-MM-DD
  final String appointmentTime; // HH:mm
  final String status; // 'booked', 'confirmed', 'completed', 'cancelled'
  final String notes;
  final String adminNotes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  AppointmentModel({
    required this.id,
    required this.userId,
    this.doctorId = '',
    required this.procedureId,
    required this.procedureName,
    required this.appointmentDate,
    required this.appointmentTime,
    this.status = 'booked',
    this.notes = '',
    this.adminNotes = '',
    this.createdAt,
    this.updatedAt,
  });

  /// Convert to Firestore Map
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'doctorId': doctorId,
      'procedureId': procedureId,
      'procedureName': procedureName,
      'appointmentDate': appointmentDate,
      'appointmentTime': appointmentTime,
      'status': status,
      'notes': notes,
      'adminNotes': adminNotes,
      'createdAt': createdAt != null 
          ? Timestamp.fromDate(createdAt!) 
          : FieldValue.serverTimestamp(),
      'updatedAt': updatedAt != null 
          ? Timestamp.fromDate(updatedAt!) 
          : FieldValue.serverTimestamp(),
    };
  }

  /// Create from Firestore document
  factory AppointmentModel.fromMap(Map<String, dynamic> data, String documentId) {
    return AppointmentModel(
      id: documentId,
      userId: data['userId'] ?? '',
      doctorId: data['doctorId'] ?? '',
      procedureId: data['procedureId'] ?? '',
      procedureName: data['procedureName'] ?? '',
      appointmentDate: data['appointmentDate'] ?? '',
      appointmentTime: data['appointmentTime'] ?? '',
      status: data['status'] ?? 'booked',
      notes: data['notes'] ?? '',
      adminNotes: data['adminNotes'] ?? '',
      createdAt: data['createdAt'] != null 
          ? (data['createdAt'] as Timestamp).toDate() 
          : null,
      updatedAt: data['updatedAt'] != null 
          ? (data['updatedAt'] as Timestamp).toDate() 
          : null,
    );
  }

  /// Create from snapshot
  factory AppointmentModel.fromSnapshot(DocumentSnapshot snapshot) {
    return AppointmentModel.fromMap(
      snapshot.data() as Map<String, dynamic>,
      snapshot.id,
    );
  }

  /// CopyWith method
  AppointmentModel copyWith({
    String? id,
    String? userId,
    String? doctorId,
    String? procedureId,
    String? procedureName,
    String? appointmentDate,
    String? appointmentTime,
    String? status,
    String? notes,
    String? adminNotes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AppointmentModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      doctorId: doctorId ?? this.doctorId,
      procedureId: procedureId ?? this.procedureId,
      procedureName: procedureName ?? this.procedureName,
      appointmentDate: appointmentDate ?? this.appointmentDate,
      appointmentTime: appointmentTime ?? this.appointmentTime,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      adminNotes: adminNotes ?? this.adminNotes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() =>
      'AppointmentModel(id: $id, userId: $userId, procedureName: $procedureName, date: $appointmentDate)';
}