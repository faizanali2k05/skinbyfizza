import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:skinbyfizza/services/auth_service.dart';
import 'package:skinbyfizza/services/notification_service.dart';
import 'app.dart';

import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

import 'package:skinbyfizza/populate_firestore.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // Only populate if needed (check settings or first run)
  // For now, just initialize notification service
  await NotificationService().initialize();
  
  runApp(
    ChangeNotifierProvider(
      create: (context) => AuthService(),
      child: const SkinbyFizaApp(),
    ),
  );
}