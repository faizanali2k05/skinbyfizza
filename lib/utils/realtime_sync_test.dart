import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../services/appointment_service.dart';
import '../services/chat_service.dart';
import '../services/notification_service.dart';

/// Test utility to verify real-time synchronization functionality
class RealtimeSyncTester {
  static final AppointmentService _appointmentService = AppointmentService();
  static final ChatService _chatService = ChatService();
  static final NotificationService _notificationService = NotificationService();

  /// Test appointment real-time updates
  static void testAppointmentSync() {
    print('Testing Appointment Real-time Synchronization...');
    
    // Listen to all appointments stream
    _appointmentService.getAllAppointmentsStream().listen((appointments) {
      print('Received ${appointments.length} appointments from real-time stream');
    });
  }

  /// Test chat real-time updates
  static void testChatSync(String adminId) {
    print('Testing Chat Real-time Synchronization...');
    
    // Listen to admin conversations
    _chatService.getAdminConversationsStream(adminId).listen((conversations) {
      print('Received ${conversations.length} conversations from real-time stream');
    });
  }

  /// Test notification real-time updates
  static void testNotificationSync(String userId) {
    print('Testing Notification Real-time Synchronization...');
    
    // Listen to user notifications
    _notificationService.getUserNotificationsStream(userId).listen((notifications) {
      print('Received ${notifications.length} notifications from real-time stream');
    });
  }

  /// Force a refresh of a collection to test sync
  static Future<void> forceRefresh(String collection) async {
    try {
      await FirebaseFirestore.instance.collection(collection).limit(1).get();
      print('Force refreshed collection: $collection');
    } catch (e) {
      print('Error forcing refresh: $e');
    }
  }
}