import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:skinbyfizza/screens/auth/welcome_screen.dart';
import 'package:skinbyfizza/screens/home/home_screen.dart';
import 'package:skinbyfizza/screens/admin/simple_admin_screen.dart';
import 'package:skinbyfizza/services/auth_service.dart';
import 'package:skinbyfizza/constants/colors.dart';

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);

    return StreamBuilder<User?>(
      stream: authService.authStateChanges,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          );
        }

        if (snapshot.hasData && snapshot.data != null) {
          final User user = snapshot.data!;
          
          // Fetch Role
          return FutureBuilder<String>(
            future: authService.getUserRole(user.uid),
            builder: (context, roleSnapshot) {
              if (roleSnapshot.connectionState == ConnectionState.waiting) {
                 return const Scaffold(
                    body: Center(
                      child: CircularProgressIndicator(color: AppColors.primary),
                    ),
                  );
              }

              if (roleSnapshot.hasData && roleSnapshot.data == 'admin') {
                return const SimpleAdminScreen();
              } else {
                return const HomeScreen();
              }
            },
          );
        }
        
        return const WelcomeScreen();
      },
    );
  }
}
