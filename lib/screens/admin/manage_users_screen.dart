import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import '../../constants/colors.dart';
import '../../constants/styles.dart';
import '../../models/user_model.dart';

class ManageUsersScreen extends StatefulWidget {
  const ManageUsersScreen({super.key});

  @override
  State<ManageUsersScreen> createState() => _ManageUsersScreenState();
}

class _ManageUsersScreenState extends State<ManageUsersScreen> {
  final CollectionReference _usersRef = FirebaseFirestore.instance.collection('users');

  Future<void> _addUser(String name, String email, String password, String phone) async {
    FirebaseApp? secondaryApp;
    try {
      // 1. Initialize a secondary Firebase App to create user without logging out Admin
      secondaryApp = await Firebase.initializeApp(
        name: 'SecondaryApp',
        options: Firebase.app().options,
      );

      final secondaryAuth = FirebaseAuth.instanceFor(app: secondaryApp);

      // 2. Create User in Auth
      final userCredential = await secondaryAuth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      // 3. Create User Document in Firestore
      // Note: We use the UID from the newly created auth user
      final uid = userCredential.user!.uid;
      
      final newUser = UserModel(
        uid: uid,
        email: email,
        name: name,
        displayName: name,
        phone: phone,
        phoneNumber: phone,
        role: 'user',
        createdAt: DateTime.now(),
        status: 'active',
      );
      
      await _usersRef.doc(uid).set(newUser.toMap());

      await secondaryAuth.signOut();
      
      if (mounted) {
         Navigator.pop(context);
         ScaffoldMessenger.of(context).showSnackBar(
           const SnackBar(content: Text("User created successfully")),
         );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error adding user: $e")));
      }
    } finally {
      // 4. Clean up secondary app
      if (secondaryApp != null) {
        await secondaryApp.delete();
      }
    }
  }

  Future<void> _updateUser(String uid, Map<String, dynamic> data) async {
    try {
      await _usersRef.doc(uid).update(data);
      if (mounted && Navigator.canPop(context)) Navigator.pop(context); // Close bottom sheet or dialog
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error updating user: $e")));
    }
  }

  Future<void> _deleteUser(String uid) async {
      final confirm = await showDialog(context: context, builder: (context) => AlertDialog(
          title: const Text("Delete User"),
          content: const Text("Are you sure? This cannot be undone."),
          actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("No")),
              TextButton(onPressed: () => Navigator.pop(context, true), child: const Text("Yes", style: TextStyle(color: Colors.red))),
          ],
      ));

      if (confirm == true) {
           try {
              await _usersRef.doc(uid).delete();
              if (mounted) Navigator.pop(context); // Close bottom sheet
           } catch (e) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error deleting user: $e")));
           }
      }
  }

  void _showAddUserDialog({UserModel? user}) {
    final nameController = TextEditingController(text: user?.displayName ?? '');
    final emailController = TextEditingController(text: user?.email ?? '');
    final passwordController = TextEditingController(); // Don't pre-fill password for security
    final phoneController = TextEditingController(text: user?.phoneNumber ?? '');
    final isEditing = user != null;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isEditing ? "Edit User" : "Add User"),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameController, decoration: AppStyles.inputDecoration("Full Name")),
              const SizedBox(height: 10),
              TextField(controller: emailController, decoration: AppStyles.inputDecoration("Email")),
              const SizedBox(height: 10),
              // Only show password field when creating a new user, or make it optional for editing
              if (!isEditing)
                TextField(controller: passwordController, decoration: AppStyles.inputDecoration("Password")),
              const SizedBox(height: 10),
              TextField(controller: phoneController, decoration: AppStyles.inputDecoration("Phone Number")),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
                final name = nameController.text.trim();
                final email = emailController.text.trim();
                final password = passwordController.text.trim();
                final phone = phoneController.text.trim();

                if (name.isEmpty || email.isEmpty) return;
                if (!isEditing && password.isEmpty) return; // Password required for new user

                if (isEditing) {
                    final updates = {
                        'displayName': name,
                        'email': email,
                        'phoneNumber': phone,
                    };
                    // Note: Changing password requires Admin SDK or re-authentication, which is complex on client side.
                    // Usually admins don't change user passwords directly without a reset email flow.
                    
                    _updateUser(user!.uid, updates);
                } else {
                    _addUser(name, email, password, phone);
                }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: Text(isEditing ? "Save" : "Add", style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showUserOptions(UserModel user) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit, color: Colors.blue),
              title: const Text("Edit User"),
              onTap: () {
                  Navigator.pop(context);
                  _showAddUserDialog(user: user);
              },
            ),
            ListTile(
              leading: Icon(Icons.admin_panel_settings, color: user.role == 'admin' ? Colors.red : Colors.green),
              title: Text(user.role == 'admin' ? "Remove Admin Role" : "Make Admin"),
              onTap: () {
                Navigator.pop(context);
                _updateUser(user.uid, {'role': user.role == 'admin' ? 'client' : 'admin'});
              },
            ),
             if (user.status == 'Active')
            ListTile(
              leading: const Icon(Icons.block, color: Colors.orange),
              title: const Text("Block User"),
              onTap: () => _updateUser(user.uid, {'status': 'Blocked'}),
            )
            else
            ListTile(
              leading: const Icon(Icons.check_circle, color: Colors.green),
              title: const Text("Unblock User"),
              onTap: () => _updateUser(user.uid, {'status': 'Active'}),
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: Colors.red),
              title: const Text("Delete User"),
              onTap: () => _deleteUser(user.uid),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text("Manage Users", style: TextStyle(color: Colors.black)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: AppColors.primary),
            onPressed: () {
              _showAddUserDialog();
            },
          ),
        ],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _usersRef.snapshots(),
        builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
            if (snapshot.hasError) return Center(child: Text("Error: ${snapshot.error}"));

            final docs = snapshot.data?.docs ?? [];
            if (docs.isEmpty) return const Center(child: Text("No users found."));

            final sortedDocs = docs.toList()..sort((a, b) {
              final aData = a.data() as Map<String, dynamic>;
              final bData = b.data() as Map<String, dynamic>;
              
              final aTime = aData['createdAt'] as Timestamp?;
              final bTime = bData['createdAt'] as Timestamp?;
              
              if (aTime == null && bTime == null) return 0;
              if (aTime == null) return 1;
              if (bTime == null) return -1;
              
              return bTime.compareTo(aTime);
            });

            return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: sortedDocs.length,
                itemBuilder: (context, index) {
                    final data = sortedDocs[index].data() as Map<String, dynamic>;
                    final user = UserModel.fromMap(data, sortedDocs[index].id);
                    return _buildUserCard(user);
                },
            );
        },
      ),
    );
  }

  Widget _buildUserCard(UserModel user) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: AppStyles.cardDecoration,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                user.displayName?.isNotEmpty == true ? user.displayName![0].toUpperCase() : '?',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.displayName ?? "No Name",
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  user.email,
                  style: AppStyles.bodySmall,
                ),
                if (user.createdAt != null)
                   Text(
                   "Created: ${_formatDate(user.createdAt!)}",
                   style: const TextStyle(fontSize: 10, color: Colors.grey),
                   ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _buildBadge(user.role, user.role == 'admin' || user.role == 'Admin' || user.role == 'ADMIN' ? Colors.purple : Colors.blue),
                    const SizedBox(width: 8),
                    _buildBadge(user.status, user.status == 'Active' ? Colors.green : Colors.red),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert, color: Colors.grey),
            onPressed: () {
              _showUserOptions(user);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
       return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            text,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        );
  }

  String _formatDate(DateTime date) {
      final months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return "${months[date.month - 1]} ${date.day}, ${date.year} at ${_formatTime(date)}";
  }

  String _formatTime(DateTime date) {
    final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
    final minute = date.minute.toString().padLeft(2, '0');
    final period = date.hour >= 12 ? 'PM' : 'AM';
    return "$hour:$minute $period";
  }
}