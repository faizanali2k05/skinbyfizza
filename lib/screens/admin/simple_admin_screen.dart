import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../constants/colors.dart';
import '../../constants/styles.dart';
import '../../services/appointment_service.dart';
import '../../routes/app_routes.dart';

class SimpleAdminScreen extends StatefulWidget {
  const SimpleAdminScreen({super.key});

  @override
  State<SimpleAdminScreen> createState() => _SimpleAdminScreenState();
}

class _SimpleAdminScreenState extends State<SimpleAdminScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Admin Panel', 
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
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
                  context, 
                  AppRoutes.signIn, 
                  (route) => false
                );
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Dashboard Stats
            Text('Dashboard Overview', style: AppStyles.h2),
            const SizedBox(height: 16),
            
            Row(
              children: [
                _buildStatCard('Appointments', Icons.calendar_today),
                const SizedBox(width: 12),
                _buildStatCard('Users', Icons.person),
              ],
            ),
            
            const SizedBox(height: 32),

            // Appointments Section
            Text('Manage Appointments', style: AppStyles.h2),
            const SizedBox(height: 16),
            
            StreamBuilder<QuerySnapshot>(
              stream: _appointmentService.getAllAppointments(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Center(
                    child: Text('Error: ${snapshot.error}'),
                  );
                }

                final appointments = snapshot.data?.docs ?? [];

                if (appointments.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('No appointments yet'),
                  );
                }

                return Column(
                  children: appointments.map((doc) {
                    final data = doc.data() as Map<String, dynamic>;
                    return _buildAppointmentCard(
                      docId: doc.id,
                      procedureName: data['procedureName'] ?? 'Unknown',
                      appointmentDate: data['appointmentDate'] ?? 'N/A',
                      appointmentTime: data['appointmentTime'] ?? 'N/A',
                      status: data['status'] ?? 'booked',
                    );
                  }).toList(),
                );
              },
            ),

            const SizedBox(height: 32),

            // Users Section
            Text('Manage Users', style: AppStyles.h2),
            const SizedBox(height: 16),
            
            StreamBuilder<QuerySnapshot>(
              stream: _firestore.collection('users').snapshots(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }

                final users = snapshot.data?.docs ?? [];

                if (users.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('No users'),
                  );
                }

                return Column(
                  children: users.map((doc) {
                    final data = doc.data() as Map<String, dynamic>;
                    return _buildUserCard(
                      docId: doc.id,
                      email: data['email'] ?? 'N/A',
                      displayName: data['displayName'] ?? 'Unknown',
                      role: data['role'] ?? 'user',
                    );
                  }).toList(),
                );
              },
            ),

            const SizedBox(height: 32),

            // Seed Data Button
            Center(
              child: ElevatedButton.icon(
                onPressed: _seedFirestore,
                icon: const Icon(Icons.refresh),
                label: const Text('Populate Sample Data'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: AppColors.primary, size: 28),
            const SizedBox(height: 8),
            Text(title, style: AppStyles.bodySmall),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentCard({
    required String docId,
    required String procedureName,
    required String appointmentDate,
    required String appointmentTime,
    required String status,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(procedureName, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text('$appointmentDate at $appointmentTime', 
                  style: TextStyle(color: Colors.grey[600], fontSize: 12)),
              ],
            ),
          ),
          PopupMenuButton(
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'completed',
                child: const Text('Mark Completed'),
                onTap: () => _updateStatus(docId, 'completed'),
              ),
              PopupMenuItem(
                value: 'missed',
                child: const Text('Mark Missed'),
                onTap: () => _updateStatus(docId, 'missed'),
              ),
              PopupMenuItem(
                value: 'cancelled',
                child: const Text('Cancel'),
                onTap: () => _updateStatus(docId, 'cancelled'),
              ),
            ],
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getStatusColor(status),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                status,
                style: const TextStyle(fontSize: 12, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserCard({
    required String docId,
    required String email,
    required String displayName,
    required String role,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(displayName, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text(email, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: role == 'admin' ? Colors.orange : Colors.blue,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              role,
              style: const TextStyle(fontSize: 12, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'completed':
        return Colors.green;
      case 'missed':
        return Colors.red;
      case 'cancelled':
        return Colors.orange;
      default:
        return Colors.blue;
    }
  }

  Future<void> _updateStatus(String appointmentId, String newStatus) async {
    try {
      await _appointmentService.updateAppointmentStatus(
        appointmentId: appointmentId,
        status: newStatus,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Status updated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _seedFirestore() async {
    try {
      // Seed procedures
      final procsSnapshot = await _firestore.collection('procedures').get();
      if (procsSnapshot.docs.isEmpty) {
        final procedures = [
          {'title': 'HydraFacial', 'price': 8500, 'category': 'Facial', 'description': 'Advanced hydration facial'},
          {'title': 'Botox', 'price': 15000, 'category': 'Injectables', 'description': 'Anti-wrinkle injection'},
          {'title': 'Laser Hair Removal', 'price': 10000, 'category': 'Laser', 'description': 'Permanent hair reduction'},
        ];
        for (var proc in procedures) {
          await _firestore.collection('procedures').add(proc);
        }
      }

      // Seed FAQs
      final faqSnapshot = await _firestore.collection('faqs').get();
      if (faqSnapshot.docs.isEmpty) {
        final faqs = [
          {
            'keywords': ['hours', 'open', 'time'],
            'answer': 'We are open Monday to Saturday, 11 AM to 8 PM. Closed Sundays.',
            'category': 'info'
          },
          {
            'keywords': ['location', 'address'],
            'answer': 'We are located at DHA Phase 6, Karachi.',
            'category': 'info'
          },
          {
            'keywords': ['price', 'cost', 'fee'],
            'answer': 'Prices vary by procedure. Check our procedures section for details.',
            'category': 'services'
          },
        ];
        for (var faq in faqs) {
          await _firestore.collection('faqs').add(faq);
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sample data added successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }
}
