import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:io';
import 'dart:async';
import '../models/notification_model.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    // Initialize timezone
    tz.initializeTimeZones();
    try {
      final String timeZoneName = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(timeZoneName));
    } catch (e) {
      print('Could not get local timezone: $e');
      tz.setLocalLocation(tz.UTC); 
    }

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    if (Platform.isAndroid) {
        final androidImplementation = _notifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
        await androidImplementation?.requestNotificationsPermission();
    }

    if (Platform.isIOS) {
        await _notifications
            .resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()
            ?.requestPermissions(alert: true, badge: true, sound: true);
    }

    _initialized = true;
  }

  void _onNotificationTapped(NotificationResponse response) {
    print('Notification tapped: ${response.payload}');
  }

  // ==================== Real-time Notification Streams ======================

  /// Get real-time stream of notifications for user (sorted by newest first)
  Stream<List<NotificationModel>> getUserNotificationsStream(String userId) {
    return FirebaseFirestore.instance
        .collection('notifications')
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => NotificationModel.fromSnapshot(doc))
            .toList())
        .handleError((error) {
          print('Error fetching notifications stream: $error');
          return <NotificationModel>[];
        });
  }

  /// Get real-time stream of unread count for user (for badge display)
  Stream<int> getUnreadCountStream(String userId) {
    return FirebaseFirestore.instance
        .collection('notifications')
        .where('userId', isEqualTo: userId)
        .where('isRead', isEqualTo: false)
        .snapshots()
        .map((snapshot) => snapshot.docs.length)
        .handleError((error) {
          print('Error fetching unread count stream: $error');
          return 0;
        });
  }

  /// Get unread count for user (single fetch)
  Future<int> getUnreadCount(String userId) async {
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('notifications')
          .where('userId', isEqualTo: userId)
          .where('isRead', isEqualTo: false)
          .get();
      return snapshot.docs.length;
    } catch (e) {
      print('Error getting unread count: $e');
      return 0;
    }
  }

  /// Mark single notification as read
  Future<String?> markAsRead(String notificationId) async {
    try {
      await FirebaseFirestore.instance
          .collection('notifications')
          .doc(notificationId)
          .update({'isRead': true});
      return null; // Success
    } catch (e) {
      return 'Error marking notification as read: $e';
    }
  }

  /// Mark all notifications as read for user
  Future<String?> markAllAsRead(String userId) async {
    try {
      final notifications = await FirebaseFirestore.instance
          .collection('notifications')
          .where('userId', isEqualTo: userId)
          .where('isRead', isEqualTo: false)
          .get();

      final batch = FirebaseFirestore.instance.batch();
      for (var doc in notifications.docs) {
        batch.update(doc.reference, {'isRead': true});
      }
      await batch.commit();
      return null; // Success
    } catch (e) {
      return 'Error marking all notifications as read: $e';
    }
  }

  /// Get QuerySnapshot stream (deprecated, use getUserNotificationsStream instead)
  @Deprecated('Use getUserNotificationsStream for typed stream')
  Stream<QuerySnapshot> getUserNotifications(String userId) {
    return FirebaseFirestore.instance
        .collection('notifications')
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  /// Create and save notification to Firestore
  /// Called by appointment and chat services to auto-create notifications
  static Future<String?> createNotification({
    required String userId,
    required String title,
    required String message,
    required String type, // 'appointment', 'message', 'status_update'
    String? appointmentId,
    String? conversationId,
  }) async {
    try {
      final notification = NotificationModel(
        id: '',
        userId: userId,
        title: title,
        message: message,
        type: type,
        appointmentId: appointmentId ?? '',
        conversationId: conversationId ?? '',
      );

      await FirebaseFirestore.instance
          .collection('notifications')
          .add(notification.toMap());
      
      return null; // Success
    } catch (e) {
      print('Error creating Firestore notification: $e');
      return 'Error creating notification: $e';
    }
  }

  /// Deprecated: Use createNotification instead
  @Deprecated('Use createNotification for typed creation')
  static Future<void> createFirestoreNotification({
    required String userId,
    required String title,
    required String message,
    required String type, // 'appointment', 'chat', 'system'
    String? appointmentId,
  }) async {
    try {
      await FirebaseFirestore.instance.collection('notifications').add({
        'userId': userId,
        'title': title,
        'message': message,
        'type': type,
        'appointmentId': appointmentId,
        'createdAt': FieldValue.serverTimestamp(),
        'isRead': false,
      });
    } catch (e) {
      print('Error creating Firestore notification: $e');
    }
  }

  StreamSubscription<QuerySnapshot>? _appointmentSubscription;
  StreamSubscription<QuerySnapshot>? _chatSubscription;

  // LISTEN TO APPOINTMENTS FOR CURRENT USER
  // This ensures that even if Admin adds an appointment, the User's app (when open/background) catches it and schedules the local notification.
  void startListeningForAppointments(String userId) {
    // Cancel existing subscription to avoid duplicates
    _appointmentSubscription?.cancel();

    _appointmentSubscription = FirebaseFirestore.instance
        .collection('appointments')
        .where('userId', isEqualTo: userId)
        .snapshots()
        .listen((snapshot) {
      for (var change in snapshot.docChanges) {
        if (change.type == DocumentChangeType.added || change.type == DocumentChangeType.modified) {
          final data = change.doc.data() as Map<String, dynamic>;
          final status = data['status'] as String?;
          final appointmentDate = data['appointmentDate'] as String?; // Format: 'YYYY-MM-DD'
          final appointmentTime = data['appointmentTime'] as String?; // Format: 'HH:mm'
          final procedureName = data['procedureName'] as String? ?? 'Appointment';
          
          if (status != 'cancelled' && appointmentDate != null && appointmentTime != null) {
            try {
              // Parse the date and time
              final parts = appointmentDate.split('-');
              final timeParts = appointmentTime.split(':');
              final parsedDate = DateTime(
                int.parse(parts[0]),
                int.parse(parts[1]),
                int.parse(parts[2]),
                int.parse(timeParts[0]),
                int.parse(timeParts[1]),
              );
              
              scheduleAppointmentReminders(
                appointmentId: change.doc.id,
                procedureName: procedureName,
                appointmentDate: parsedDate,
              );
              
              // If just assigned/booked (added), show immediate confirmation
              if (change.type == DocumentChangeType.added && status == 'booked') {
                 showInstantNotification(
                   title: 'Appointment Booked', 
                   body: 'Your appointment for $procedureName has been scheduled.'
                 );
              }
            } catch (e) {
              print('Error parsing appointment date/time: $e');
            }
          } else if (status == 'cancelled') {
            cancelAppointmentNotifications(change.doc.id);
          }
        } else if (change.type == DocumentChangeType.removed) {
          cancelAppointmentNotifications(change.doc.id);
        }
      }
    });
  }

  // Start listening for chat messages for the user
  void startListeningForChat(String userId) {
    // Cancel existing subscription to avoid duplicates
    _chatSubscription?.cancel();

    // Get the user's conversation ID
    FirebaseFirestore.instance
        .collection('conversations')
        .where('userId', isEqualTo: userId)
        .limit(1)
        .get()
        .then((querySnapshot) {
      if (querySnapshot.docs.isNotEmpty) {
        final conversationId = querySnapshot.docs.first.id;
        
        // Listen to messages in the conversation
        _chatSubscription = FirebaseFirestore.instance
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .orderBy('createdAt', descending: true)
            .limit(1)
            .snapshots()
            .listen((snapshot) {
          for (var change in snapshot.docChanges) {
            if (change.type == DocumentChangeType.added || change.type == DocumentChangeType.modified) {
              final data = change.doc.data() as Map<String, dynamic>;
              final senderId = data['senderId'] as String?;
              final text = data['text'] as String?;
              
              // Only show notification if the message is from admin (not from the current user)
              if (senderId != userId && text != null) {
                showInstantNotification(
                  title: 'New Message from Doctor',
                  body: text.length > 50 ? '${text.substring(0, 50)}...' : text,
                );
              }
            }
          }
        });
      }
    }).catchError((error) {
      print('Error getting conversation for chat notifications: $error');
    });
  }

  Future<void> scheduleAppointmentReminders({
    required String appointmentId,
    required String procedureName,
    required DateTime appointmentDate,
  }) async {
    if (!_initialized) await initialize();

    final now = DateTime.now();
    
    // Schedule 24-hour reminder
    final twentyFourHoursBefore = appointmentDate.subtract(const Duration(hours: 24));
    if (twentyFourHoursBefore.isAfter(now)) {
      await _scheduleNotification(
        id: appointmentId.hashCode,
        title: 'Appointment Reminder',
        body: 'Your $procedureName appointment is tomorrow at ${_formatTime(appointmentDate)}',
        scheduledDate: twentyFourHoursBefore,
        payload: appointmentId,
      );
    }

    // Schedule 2-hour reminder
    final twoHoursBefore = appointmentDate.subtract(const Duration(hours: 2));
    if (twoHoursBefore.isAfter(now)) {
      await _scheduleNotification(
        id: appointmentId.hashCode + 1, 
        title: 'Appointment Soon',
        body: 'Your $procedureName appointment is in 2 hours at ${_formatTime(appointmentDate)}',
        scheduledDate: twoHoursBefore,
        payload: appointmentId,
      );
    }
    
    // Schedule Completion Notification (1 hour after start)
    final completionTime = appointmentDate.add(const Duration(hours: 1));
    if (completionTime.isAfter(now)) {
       await _scheduleNotification(
        id: appointmentId.hashCode + 2,
        title: 'Appointment Completed',
        body: 'We hope your $procedureName went well! Please rate your experience.',
        scheduledDate: completionTime,
        payload: appointmentId,
      );
    }
  }

  Future<void> _scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'appointment_reminders',
      'Appointment Reminders',
      channelDescription: 'Notifications for upcoming appointments',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.zonedSchedule(
      id,
      title,
      body,
      tz.TZDateTime.from(scheduledDate, tz.local),
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
      payload: payload,
    );
  }

  Future<void> cancelAppointmentNotifications(String appointmentId) async {
    await _notifications.cancel(appointmentId.hashCode);
    await _notifications.cancel(appointmentId.hashCode + 1);
    await _notifications.cancel(appointmentId.hashCode + 2);
  }

  String _formatTime(DateTime date) {
    final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
    final minute = date.minute.toString().padLeft(2, '0');
    final period = date.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $period';
  }

  Future<void> showInstantNotification({
    required String title,
    required String body,
  }) async {
    if (!_initialized) await initialize();

    const androidDetails = AndroidNotificationDetails(
      'instant_notifications',
      'Instant Notifications',
      channelDescription: 'Immediate notifications',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
    );
  }
}