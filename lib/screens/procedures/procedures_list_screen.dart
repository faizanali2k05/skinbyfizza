import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../constants/colors.dart';
import '../../constants/styles.dart';
import '../../routes/app_routes.dart';
import '../../models/procedure_model.dart';
import '../chat/simple_chat_screen.dart';

class ProceduresListScreen extends StatefulWidget {
  final bool isAdmin;
  const ProceduresListScreen({super.key, this.isAdmin = false});

  @override
  State<ProceduresListScreen> createState() => _ProceduresListScreenState();
}

class _ProceduresListScreenState extends State<ProceduresListScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'All';
  
  final List<String> _categories = ['All', 'Facials', 'Injectables', 'Laser', 'Skin Rejuvenation', 'Under Eye', 'Minor Surgery'];

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {}); // Trigger rebuild on search
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onCategorySelected(String category) {
    setState(() {
      _selectedCategory = category;
    });
  }
  
  void _editProcedure(DocumentSnapshot doc) {
      // Implement Edit Logic using doc.id if needed
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () {
            if (widget.isAdmin) {
               Navigator.pop(context); // Go back to Admin Panel
            } else {
               // Go back to Dashboard/Home, ensuring bottom nav state is correct or just popping if pushed
               if (Navigator.canPop(context)) {
                 Navigator.pop(context);
               } else {
                 // Fallback if it's the root of a tab, though usually this screen is pushed
                 Navigator.pushReplacementNamed(context, AppRoutes.home);
               }
            }
          },
        ),
        title: Text(
          widget.isAdmin ? "Manage Procedures" : "Procedures",
          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: AppStyles.inputDecoration(
                "Search procedures...",
                prefixIcon: Icons.search,
              ),
            ),
          ),

          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Row(
              children: _categories.map((category) {
                final isSelected = _selectedCategory == category;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: Text(category),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) _onCategorySelected(category);
                    },
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textSecondary,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    backgroundColor: Colors.grey[200],
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                );
              }).toList(),
            ),
          ),
          
          const SizedBox(height: 16),

          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance.collection('procedures').snapshots(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                
                if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                  return const Center(child: Text("No procedures found. Admins can add them."));
                }

                // Filter logic needs to be applied to snapshot data
                final docs = snapshot.data!.docs.where((doc) {
                   final data = doc.data() as Map<String, dynamic>;
                   final title = (data['title'] ?? '').toString().toLowerCase();
                   final category = (data['category'] ?? '').toString();
                   final query = _searchController.text.toLowerCase();
                   
                   final matchesQuery = title.contains(query);
                   final matchesCategory = _selectedCategory == 'All' || category == _selectedCategory;
                   return matchesQuery && matchesCategory;
                }).toList();

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: docs.length,
                  itemBuilder: (context, index) {
                    final doc = docs[index];
                    final procedure = ProcedureModel.fromMap(doc.data() as Map<String, dynamic>, doc.id);
                    return _buildProcedureCard(context, procedure);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProcedureCard(BuildContext context, ProcedureModel procedure) {
    return GestureDetector(
      onTap: () {
        if (widget.isAdmin) {
           // _editProcedure(doc); 
        } else {
          // Navigate to Doctor Chat screen with procedure information
          Navigator.push(
            context, 
            MaterialPageRoute(
              builder: (context) => const SimpleChatScreen(),
            ),
          );
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: AppStyles.cardDecoration,
        clipBehavior: Clip.hardEdge,
        child: Row(
          children: [
            Container(
              width: 100,
              height: 100,
              color: Colors.grey[300],
              child: (procedure.imageUrl != null && procedure.imageUrl!.isNotEmpty)
                  ? Image.network(
                      procedure.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => const Icon(Icons.broken_image, size: 40, color: Colors.grey),
                    )
                  : const Icon(Icons.medical_services, size: 40, color: Colors.grey),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          procedure.category.toUpperCase(),
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (widget.isAdmin)
                          const Icon(Icons.edit, size: 16, color: Colors.grey),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      procedure.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "\$${procedure.price.toStringAsFixed(0)}",
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
             if (!widget.isAdmin)
            Container(
              height: 100,
              width: 40,
              color: AppColors.primary,
              child: const Icon(Icons.arrow_forward, color: Colors.white, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}
