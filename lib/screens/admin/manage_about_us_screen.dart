import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../constants/colors.dart';
import '../../constants/styles.dart';

class ManageAboutUsScreen extends StatefulWidget {
  const ManageAboutUsScreen({super.key});

  @override
  State<ManageAboutUsScreen> createState() => _ManageAboutUsScreenState();
}

class _ManageAboutUsScreenState extends State<ManageAboutUsScreen> {
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _instagramController = TextEditingController();
  final TextEditingController _facebookController = TextEditingController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final doc = await FirebaseFirestore.instance.collection('content').doc('about_us').get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        _descriptionController.text = data['description'] ?? '';
        _emailController.text = data['email'] ?? '';
        _phoneController.text = data['phone'] ?? '';
        _instagramController.text = data['instagram'] ?? '';
        _facebookController.text = data['facebook'] ?? '';
      } else {
        // Set defaults if not found
        _descriptionController.text = "Welcome to SkinByFizza, your premier destination for advanced skincare and aesthetic treatments.";
        _emailController.text = "contact@skinbyfizza.com";
        _phoneController.text = "+92 300 1234567";
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error loading data: $e")));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveData() async {
    setState(() => _isLoading = true);
    try {
      await FirebaseFirestore.instance.collection('content').doc('about_us').set({
        'description': _descriptionController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'instagram': _instagramController.text.trim(),
        'facebook': _facebookController.text.trim(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("About Us updated successfully!")));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error saving: $e")));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text("Manage About Us"),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.save, color: AppColors.primary),
            onPressed: _isLoading ? null : _saveData,
          )
        ],
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Description", style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _descriptionController,
                    maxLines: 5,
                    decoration: AppStyles.inputDecoration("Enter company description..."),
                  ),
                  const SizedBox(height: 20),
                  
                  const Text("Contact Information", style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _emailController,
                    decoration: AppStyles.inputDecoration("Contact Email", prefixIcon: Icons.email),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    decoration: AppStyles.inputDecoration("Phone Number", prefixIcon: Icons.phone),
                  ),
                  
                  const SizedBox(height: 20),
                  const Text("Social Media Links", style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _instagramController,
                    decoration: AppStyles.inputDecoration("Instagram URL", prefixIcon: Icons.camera_alt),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _facebookController,
                    decoration: AppStyles.inputDecoration("Facebook URL", prefixIcon: Icons.facebook),
                  ),
                  
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _saveData,
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                      child: const Text("Save Changes", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
