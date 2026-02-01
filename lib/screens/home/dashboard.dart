import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../constants/colors.dart';
import '../../constants/strings.dart';
import '../../constants/styles.dart';
import '../../routes/app_routes.dart';
import '../../models/appointment_model.dart';
import '../../models/procedure_model.dart';
import '../../services/chat_service.dart';
import '../../services/notification_service.dart';
import '../chat/unified_chat_screen.dart';
import '../appointments/appointment_detail_screen.dart';
import '../appointments/reschedule_screen.dart';
import '../appointments/book_appointment_screen.dart';
import 'notifications_screen.dart';
import '../../constants/currency.dart';

class Dashboard extends StatefulWidget {
  const Dashboard({super.key});

  @override
  State<Dashboard> createState() => _DashboardState();
}

class _DashboardState extends State<Dashboard> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final User? currentUser = FirebaseAuth.instance.currentUser;
  final ChatService _chatService = ChatService();

  @override
  void initState() {
    super.initState();
    if (currentUser != null) {
      NotificationService().startListeningForAppointments(currentUser!.uid);
      NotificationService().startListeningForChat(currentUser!.uid);
    }
  }

  // Featured procedures data is now fetched from Firestore

  Future<void> _launchShopUrl() async {
    final Uri url = Uri.parse('https://5kassi.com/skinbyfizza/shop/');
    if (!await launchUrl(url, mode: LaunchMode.inAppWebView)) {
      throw Exception('Could not launch $url');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.background,
      endDrawer: _buildNotificationDrawer(),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Dynamic Header
              _buildDynamicHeader(),
              
              const SizedBox(height: 24),

              // Quick Access Grid
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.1,
                children: [
                  _buildQuickAccessCard(
                    context,
                    title: AppStrings.procedures,
                    subtitle: AppStrings.bookNow,
                    icon: Icons.calendar_today,
                    color: AppColors.cardProcedures,
                    iconColor: AppColors.warning,
                    onTap: () => Navigator.pushNamed(context, AppRoutes.procedures),
                  ),
                  _buildQuickAccessCard(
                    context,
                    title: AppStrings.shop,
                    subtitle: AppStrings.browse,
                    icon: Icons.shopping_bag_outlined,
                    color: AppColors.cardShop,
                    iconColor: AppColors.accent,
                    onTap: _launchShopUrl,
                  ),
                  _buildQuickAccessCard(
                    context,
                    title: AppStrings.aiChat,
                    subtitle: AppStrings.getAdvice,
                    icon: Icons.chat_bubble_outline,
                    color: AppColors.cardAiChat,
                    iconColor: Colors.teal,
                    onTap: () => Navigator.pushNamed(context, AppRoutes.aiChat),
                  ),
                  _buildDoctorDeskCard(), // Extracted to support stream builder for notification dot
                ],
              ),
              const SizedBox(height: 32),

              // Upcoming Appointments Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(AppStrings.upcomingAppointments, style: AppStyles.h3),
                  TextButton(
                    onPressed: () => Navigator.pushNamed(context, AppRoutes.appointments),
                    child: Text(
                      AppStrings.seeAll,
                      style: AppStyles.bodyMedium.copyWith(color: AppColors.primary),
                    ),
                  ),
                ],
              ),
              
              // Dynamic Appointment Card
              _buildUpcomingAppointmentCard(),

              const SizedBox(height: 32),

              // Featured Procedures
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Featured Procedures", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  TextButton(
                    onPressed: () => Navigator.pushNamed(context, AppRoutes.procedures),
                    child: Text(
                      AppStrings.seeAll,
                      style: AppStyles.bodyMedium.copyWith(color: AppColors.primary),
                    ),
                  ),
                ],
              ),
              
              SizedBox(
                height: 180, 
                child: StreamBuilder<QuerySnapshot>(
                  stream: FirebaseFirestore.instance.collection('procedures').limit(5).snapshots(),
                  builder: (context, snapshot) {
                     if (snapshot.connectionState == ConnectionState.waiting) {
                       return const Center(child: CircularProgressIndicator());
                     }

                     if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                       return const Center(child: Text("No procedures available yet."));
                     }

                     final docs = snapshot.data!.docs;
                     
                     return ListView.builder(
                       scrollDirection: Axis.horizontal,
                       itemCount: docs.length,
                       itemBuilder: (context, index) {
                         final doc = docs[index];
                         final procedure = ProcedureModel.fromMap(doc.data() as Map<String, dynamic>, doc.id);
                         return _buildFeaturedProcedureCard(procedure);
                       },
                     );
                  },
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDoctorDeskCard() {
    return StreamBuilder<int>(
      stream: currentUser != null 
          ? _chatService.getUserUnreadCountStream(currentUser!.uid) 
          : Stream.value(0),
      builder: (context, snapshot) {
        final unreadCount = snapshot.data ?? 0;
        
        return Stack(
          clipBehavior: Clip.none,
          children: [
            _buildQuickAccessCard(
              context,
              title: AppStrings.medicalTourism,
              subtitle: "Consult with doctor",
              icon: Icons.medical_services_outlined,
              color: AppColors.cardMedical,
              iconColor: AppColors.secondary,
              onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const UnifiedChatScreen()),
                  );
              },
            ),
            if (unreadCount > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    unreadCount > 9 ? '9+' : unreadCount.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildDynamicHeader() {
    if (currentUser == null) return const SizedBox();
    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance.collection('users').doc(currentUser!.uid).snapshots(),
      builder: (context, snapshot) {
        String displayName = "User";
        if (snapshot.hasData && snapshot.data!.exists) {
          final data = snapshot.data!.data() as Map<String, dynamic>;
          displayName = data['displayName'] ?? data['name'] ?? "User";
        }

        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(AppStrings.hello, style: AppStyles.bodyLarge),
                const SizedBox(height: 4),
                Text(
                  displayName,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined, size: 28),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const NotificationsScreen()),
                    );
                  },
                ),
                StreamBuilder<int>(
                  stream: currentUser != null 
                      ? _chatService.getUserUnreadCountStream(currentUser!.uid) 
                      : Stream.value(0),
                  builder: (context, snapshot) {
                    if (snapshot.hasData && snapshot.data! > 0) {
                      return Positioned(
                        right: 8,
                        top: 8,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 8,
                            minHeight: 8,
                          ),
                        ),
                      );
                    }
                    return const SizedBox();
                  },
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildUpcomingAppointmentCard() {
    if (currentUser == null) return const SizedBox();

    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('appointments')
          .where('userId', isEqualTo: currentUser!.uid)
          .orderBy('appointmentDate')
          .orderBy('appointmentTime')
          .limit(1)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: AppStyles.cardDecoration,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.calendar_today_outlined, size: 48, color: Colors.grey),
                const SizedBox(height: 12),
                const Text(
                  "No upcoming appointments.", 
                  style: TextStyle(color: Colors.grey, fontSize: 16),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.bookAppointment),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text("Book Appointment", style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          );
        }

        // Filter for upcoming appointments (status: booked, confirmed; and date is in the future)
        final allDocs = snapshot.data!.docs;
        final upcomingDocs = allDocs.where((doc) {
          final appointment = AppointmentModel.fromMap(doc.data() as Map<String, dynamic>, doc.id);
          
          // Parse the appointment date
          DateTime appointmentDateTime = DateTime.now();
          try {
            final dateParts = appointment.appointmentDate.split('-');
            final timeParts = appointment.appointmentTime.split(':');
            if (dateParts.length == 3 && timeParts.length >= 2) {
              final year = int.parse(dateParts[0]);
              final month = int.parse(dateParts[1]);
              final day = int.parse(dateParts[2]);
              final hour = int.parse(timeParts[0]);
              final minute = int.parse(timeParts[1]);
              appointmentDateTime = DateTime(year, month, day, hour, minute);
            }
          } catch (e) {
            print('Error parsing appointment date: $e');
          }
          
          // Check if status is upcoming and date is in the future
          return (appointment.status == 'booked' || appointment.status == 'confirmed') &&
                 appointmentDateTime.isAfter(DateTime.now());
        }).toList();

        if (upcomingDocs.isEmpty) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: AppStyles.cardDecoration,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.calendar_today_outlined, size: 48, color: Colors.grey),
                const SizedBox(height: 12),
                const Text(
                  "No upcoming appointments.", 
                  style: TextStyle(color: Colors.grey, fontSize: 16),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, AppRoutes.bookAppointment),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text("Book Appointment", style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          );
        }

        final doc = upcomingDocs.first;
        final appointment = AppointmentModel.fromMap(doc.data() as Map<String, dynamic>, doc.id);

        // Parse the appointment date string to a DateTime object
        DateTime appointmentDateTime = DateTime.now();
        try {
          final dateParts = appointment.appointmentDate.split('-');
          final timeParts = appointment.appointmentTime.split(':');
          if (dateParts.length == 3 && timeParts.length >= 2) {
            final year = int.parse(dateParts[0]);
            final month = int.parse(dateParts[1]);
            final day = int.parse(dateParts[2]);
            final hour = int.parse(timeParts[0]);
            final minute = int.parse(timeParts[1]);
            appointmentDateTime = DateTime(year, month, day, hour, minute);
          }
        } catch (e) {
          print('Error parsing appointment date: $e');
        }

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: AppStyles.cardDecoration,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   Row(
                     children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.cardProcedures, 
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            children: [
                              Text(appointmentDateTime.day.toString(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              Text(_getMonth(appointmentDateTime), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(appointment.procedureName, style: AppStyles.h3.copyWith(fontSize: 16)),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.access_time, size: 14, color: AppColors.textSecondary),
                                const SizedBox(width: 4),
                                Text(_formatTime(appointmentDateTime), style: AppStyles.bodySmall),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.location_on_outlined, size: 14, color: AppColors.textSecondary),
                                const SizedBox(width: 4),
                                Text("Main Clinic", style: AppStyles.bodySmall),
                              ],
                            ),
                          ],
                        ),
                     ],
                   ),
                   Container(
                     padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                     decoration: BoxDecoration(
                       color: _getStatusColor(appointment.status),
                       borderRadius: BorderRadius.circular(20),
                     ),
                     child: Text(
                       appointment.status,
                       style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                     ),
                   ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => RescheduleScreen(appointmentId: doc.id),
                          ),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.black,
                        side: BorderSide.none,
                        backgroundColor: Colors.grey[100],
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text("Reschedule"),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => AppointmentDetailScreen(appointmentId: doc.id),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text("View Details", style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildNotificationDrawer() {
    return Drawer(
      child: Container(
        color: Colors.white,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 50),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                "Notifications",
                style: AppStyles.h2,
              ),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _buildNotificationItem(
                    "Special Offer",
                    "Get 20% off on HydraFacial this week!",
                    "5 hours ago",
                    Icons.local_offer,
                    Colors.orange,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationItem(String title, String message, String time, IconData icon, Color color) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: color.withValues(alpha: 0.1),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          Text(message, style: const TextStyle(fontSize: 12)),
          const SizedBox(height: 4),
          Text(time, style: TextStyle(fontSize: 10, color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildQuickAccessCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: AppStyles.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeaturedProcedureCard(ProcedureModel procedure) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => BookAppointmentScreen(
              preSelectedProcedure: procedure,
            ),
          ),
        );
      },
      child: Container(
        width: 250,
        margin: const EdgeInsets.only(right: 16),
        decoration: AppStyles.cardDecoration,
        clipBehavior: Clip.hardEdge,
        child: Column( // Changed to Column for better layout in horizontal list
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                width: double.infinity,
                color: Colors.grey[200],
                child: (procedure.imageUrl != null && procedure.imageUrl!.isNotEmpty)
                    ? Image.network(
                        procedure.imageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.broken_image, size: 40, color: Colors.grey),
                      )
                    : const Icon(Icons.medical_services, size: 40, color: Colors.grey),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PROCEDURE',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    procedure.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14, // Slightly smaller
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    CurrencyConstants.formatCurrency(procedure.price, currencyCode: 'AED'),
                     style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getMonth(DateTime date) {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return months[date.month - 1];
  }

  String _formatTime(DateTime date) {
    final hour = date.hour > 12 ? date.hour - 12 : date.hour;
    final minute = date.minute.toString().padLeft(2, '0');
    final period = date.hour >= 12 ? 'PM' : 'AM';
    return "$hour:$minute $period";
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return AppColors.success;
      case 'pending':
        return AppColors.warning;
      case 'cancelled':
        return AppColors.error;
      case 'completed':
        return AppColors.primary;
      case 'booked':
        return AppColors.primary;
      case 'missed':
        return AppColors.error;
      default:
        return Colors.grey;
    }
  }
}