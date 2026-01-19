import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../screens/admin/manage_users_screen.dart';
import '../../screens/admin/manage_procedures_screen.dart';
import '../../screens/admin/manage_appointments_screen.dart';
import '../../screens/admin/admin_chat_manager_screen.dart';
import '../../screens/admin/manage_about_us_screen.dart';
import '../../constants/colors.dart';

class AdminPanelScreen extends StatefulWidget {
  const AdminPanelScreen({super.key});

  @override
  State<AdminPanelScreen> createState() => _AdminPanelScreenState();
}

class _AdminPanelScreenState extends State<AdminPanelScreen> {
  final List<Map<String, dynamic>> _adminOptions = [
    {
      'title': 'Manage Chats',
      'icon': Icons.chat_outlined,
      'screen': const AdminChatManagerScreen(),
      'color': Colors.blue,
    },
    {
      'title': 'Manage Appointments',
      'icon': Icons.calendar_month_outlined,
      'screen': const ManageAppointmentsScreen(),
      'color': Colors.green,
    },
    {
      'title': 'Manage Users',
      'icon': Icons.people_alt_outlined,
      'screen': const ManageUsersScreen(),
      'color': Colors.orange,
    },
    {
      'title': 'Manage Procedures',
      'icon': Icons.medical_services_outlined,
      'screen': const ManageProceduresScreen(),
      'color': Colors.purple,
    },
    {
      'title': 'Manage About Us',
      'icon': Icons.info_outline,
      'screen': const ManageAboutUsScreen(),
      'color': Colors.teal,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Admin Panel',
            style: TextStyle(
                color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.textPrimary),
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
              if (mounted) {
                Navigator.pushNamedAndRemoveUntil(
                    context, '/welcome', (route) => false);
              }
            },
            tooltip: 'Logout',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.1,
          ),
          itemCount: _adminOptions.length,
          itemBuilder: (context, index) {
            final option = _adminOptions[index];
            return GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => option['screen']),
                );
              },
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: option['color'].withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        option['icon'],
                        size: 32,
                        color: option['color'],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      option['title'],
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}