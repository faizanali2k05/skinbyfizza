import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../constants/colors.dart';
import '../../constants/styles.dart';
import '../../widgets/custom_button.dart';

import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../../services/chat_service.dart';

class EditProfileScreen extends StatefulWidget {
  final String? userId; // Optional userId for admin to edit other users
  
  const EditProfileScreen({super.key, this.userId});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isLoading = false;
  File? _imageFile;
  String? _currentImageUrl;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    // Use provided userId or current user's ID
    final userId = widget.userId ?? FirebaseAuth.instance.currentUser?.uid;
    
    if (userId != null) {
      final doc = await FirebaseFirestore.instance.collection('users').doc(userId).get();
      if (doc.exists) {
        final data = doc.data()!;
        setState(() {
          _nameController.text = data['displayName'] ?? '';
          _emailController.text = data['email'] ?? '';
          _phoneController.text = data['phoneNumber'] ?? '';
          _currentImageUrl = data['photoURL'];
        });
      }
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
      });
    }
  }

  Future<String?> _uploadImage(String userId) async {
    if (_imageFile == null) return null;

    try {
      final ref = FirebaseStorage.instance
          .ref()
          .child('user_profile_images')
          .child('$userId.jpg');

      await ref.putFile(_imageFile!);
      return await ref.getDownloadURL();
    } catch (e) {
      print("Error uploading image: $e");
      return null;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text("Edit Profile"),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 20),
            Stack(
              alignment: Alignment.bottomRight,
              children: [
                GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primary, width: 2),
                      color: Colors.white,
                      image: _imageFile != null
                          ? DecorationImage(image: FileImage(_imageFile!), fit: BoxFit.cover)
                          : (_currentImageUrl != null
                              ? DecorationImage(image: NetworkImage(_currentImageUrl!), fit: BoxFit.cover)
                              : null),
                    ),
                    child: (_imageFile == null && _currentImageUrl == null)
                        ? const Center(
                            child: Icon(Icons.person, size: 60, color: Colors.grey),
                          )
                        : null,
                  ),
                ),
                GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 40),
            TextField(
              controller: _nameController,
              decoration: AppStyles.inputDecoration(
                "Full Name",
                prefixIcon: Icons.person_outline,
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              enabled: widget.userId == null, // Disable email edit for admin if needed, or allow
              controller: _emailController,
              decoration: AppStyles.inputDecoration(
                "Email",
                prefixIcon: Icons.email_outlined,
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _phoneController,
              decoration: AppStyles.inputDecoration(
                "Phone Number",
                prefixIcon: Icons.phone_outlined,
              ),
            ),
            const SizedBox(height: 40),
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : CustomButton(
                    text: "Save Changes",
                    onPressed: () async {
                      if (_nameController.text.isEmpty) return;
                      
                      setState(() => _isLoading = true);
                      try {
                        // Use provided userId or current user's ID
                        final userId = widget.userId ?? FirebaseAuth.instance.currentUser?.uid;
                        
                        if (userId != null) {
                          String? photoUrl = _currentImageUrl;
                          if (_imageFile != null) {
                            photoUrl = await _uploadImage(userId);
                          }

                          // Update Firestore
                          await FirebaseFirestore.instance.collection('users').doc(userId).update({
                            'displayName': _nameController.text.trim(),
                            'email': _emailController.text.trim(),
                            'phoneNumber': _phoneController.text.trim(),
                            if (photoUrl != null) 'photoURL': photoUrl,
                          });

                          // Update Auth Profile (only if editing self)
                          if (widget.userId == null) {
                             await FirebaseAuth.instance.currentUser?.updateDisplayName(_nameController.text.trim());
                             if (photoUrl != null) {
                               await FirebaseAuth.instance.currentUser?.updatePhotoURL(photoUrl);
                             }
                          }

                          // Note: Chat profile sync would require conversation IDs which we don't have access to here
                          // This is handled automatically when messages are sent
                          
                          if (mounted) {
                             ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Profile Updated Successfully!')),
                            );
                            Navigator.pop(context);
                          }
                        }
                      } catch (e) {
                         if (mounted) {
                           ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Error: $e')),
                          );
                         }
                      } finally {
                        if (mounted) setState(() => _isLoading = false);
                      }
                    },
                  ),
          ],
        ),
      ),
    );
  }

  // Add the missing method
  Future<void> _updateConversationUserProfile(String userId, String newName, String newEmail) async {
    try {
      final conversations = await FirebaseFirestore.instance
          .collection('conversations')
          .where('userId', isEqualTo: userId)
          .get();

      final batch = FirebaseFirestore.instance.batch();
      for (var doc in conversations.docs) {
        batch.update(doc.reference, {
          'userName': newName,
          'userEmail': newEmail,
        });
      }
      await batch.commit();
    } catch (e) {
      print('Error updating conversation profile: $e');
    }
  }
}
