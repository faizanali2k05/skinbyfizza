import 'package:cloud_firestore/cloud_firestore.dart';

class AppointmentModel {
  final String id;
  final String userId;
  final String doctorId;
  final String procedureId;
  final String procedureName;
  final String appointmentDate;
  final String appointmentTime;
  String status; // 'booked', 'completed', 'missed', 'cancelled'
  final Timestamp createdAt;

  AppointmentModel({
    required this.id,
    required this.userId,
    required this.doctorId,
    required this.procedureId,
    required this.procedureName,
    required this.appointmentDate,
    required this.appointmentTime,
    this.status = 'booked',
    required this.createdAt,
  });

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
      createdAt: data['createdAt'] ?? Timestamp.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'doctorId': doctorId,
      'procedureId': procedureId,
      'procedureName': procedureName,
      'appointmentDate': appointmentDate,
      'appointmentTime': appointmentTime,
      'status': status,
      'createdAt': createdAt,
    };
  }
}