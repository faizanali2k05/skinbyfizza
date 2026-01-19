import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../constants/colors.dart';
import '../../constants/styles.dart';
import '../../widgets/app_logo.dart';

class AboutUsScreen extends StatelessWidget {
  const AboutUsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text("About Us"),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance.collection('content').doc('about_us').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          String description = "Welcome to SkinByFizza, your premier destination for advanced skincare and aesthetic treatments.";
          String email = "contact@skinbyfizza.com";
          String phone = "+92 300 1234567";
          String instagram = "";
          String facebook = "";

          if (snapshot.hasData && snapshot.data!.exists) {
            final data = snapshot.data!.data() as Map<String, dynamic>;
            description = data['description'] ?? description;
            email = data['email'] ?? email;
            phone = data['phone'] ?? phone;
            instagram = data['instagram'] ?? "";
            facebook = data['facebook'] ?? "";
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 20),
                const AppLogo(width: 200, height: 80),
                const SizedBox(height: 40),
                Text(
                  "Who We Are",
                  style: AppStyles.h2,
                ),
                const SizedBox(height: 16),
                Text(
                  description,
                  textAlign: TextAlign.center,
                  style: AppStyles.bodyLarge.copyWith(height: 1.6),
                ),
                const SizedBox(height: 40),
                
                // Contact Section
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: AppStyles.cardDecoration,
                  width: double.infinity,
                  child: Column(
                    children: [
                      const Text("Contact Us", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                      const SizedBox(height: 16),
                      _buildContactRow(Icons.email, email, () => _launchEmail(email)),
                      const Divider(height: 24),
                      _buildContactRow(Icons.phone, phone, () => _launchPhone(phone)),
                    ],
                  ),
                ),

                const SizedBox(height: 30),
                
                // Social Media
                if (instagram.isNotEmpty || facebook.isNotEmpty) ...[
                   const Text("Follow Us", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                   const SizedBox(height: 16),
                   Row(
                     mainAxisAlignment: MainAxisAlignment.center,
                     children: [
                       if (instagram.isNotEmpty)
                         IconButton(
                           icon: const Icon(Icons.camera_alt, color: Colors.purple, size: 30), // Placeholder for Insta
                           onPressed: () => _launchUrl(instagram),
                         ),
                       if (facebook.isNotEmpty)
                         IconButton(
                           icon: const Icon(Icons.facebook, color: Colors.blue, size: 30),
                           onPressed: () => _launchUrl(facebook),
                         ),
                     ],
                   ),
                ],
                
                const SizedBox(height: 40),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _launchEmail(email),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text("Get in Touch", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String text, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 16)),
          ),
          const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
        ],
      ),
    );
  }

  Future<void> _launchUrl(String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  Future<void> _launchEmail(String email) async {
    final Uri url = Uri(
      scheme: 'mailto',
      path: email,
    );
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  Future<void> _launchPhone(String phone) async {
    final Uri url = Uri(
      scheme: 'tel',
      path: phone,
    );
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }
}
