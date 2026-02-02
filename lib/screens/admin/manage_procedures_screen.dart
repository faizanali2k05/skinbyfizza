import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../constants/colors.dart';
import '../../constants/currency.dart';
import '../../constants/styles.dart';
import '../../models/procedure_model.dart';

class ManageProceduresScreen extends StatefulWidget {
  const ManageProceduresScreen({super.key});

  @override
  State<ManageProceduresScreen> createState() => _ManageProceduresScreenState();
}

class _ManageProceduresScreenState extends State<ManageProceduresScreen> {
  final CollectionReference _proceduresRef = FirebaseFirestore.instance.collection('procedures');

  void _showProcedureDialog({ProcedureModel? procedure}) {
    final titleController = TextEditingController(text: procedure?.title ?? '');
    final descriptionController = TextEditingController(text: procedure?.description ?? '');
    final priceController = TextEditingController(text: procedure?.price.toString() ?? '');
    final imageUrlController = TextEditingController(text: procedure?.imageUrl ?? '');
    final categoryController = TextEditingController(text: procedure?.category ?? '');
    final sessionsController = TextEditingController(text: procedure?.sessions.toString() ?? '1');
    final visitsController = TextEditingController(text: procedure?.visitsPerSession.toString() ?? '1');
    
    // Key features list
    final List<TextEditingController> featureControllers = [];
    if (procedure != null && procedure.keyFeatures.isNotEmpty) {
      for (var feature in procedure.keyFeatures) {
        featureControllers.add(TextEditingController(text: feature));
      }
    } else {
      featureControllers.add(TextEditingController());
    }

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: Text(procedure == null ? "Add Procedure" : "Edit Procedure"),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: titleController,
                    decoration: AppStyles.inputDecoration("Title"),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: descriptionController,
                    decoration: AppStyles.inputDecoration("Description"),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: priceController,
                    decoration: AppStyles.inputDecoration("Price"),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: sessionsController,
                          decoration: AppStyles.inputDecoration("Sessions"),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: visitsController,
                          decoration: AppStyles.inputDecoration("Visits/Session"),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: imageUrlController,
                    decoration: AppStyles.inputDecoration("Image URL (Optional)"),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: categoryController,
                    decoration: AppStyles.inputDecoration("Category"),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    "Key Features",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  ...featureControllers.asMap().entries.map((entry) {
                    final index = entry.key;
                    final controller = entry.value;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: controller,
                              decoration: AppStyles.inputDecoration("Feature ${index + 1}"),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.remove_circle, color: Colors.red),
                            onPressed: () {
                              if (featureControllers.length > 1) {
                                setDialogState(() {
                                  featureControllers.removeAt(index);
                                });
                              }
                            },
                          ),
                        ],
                      ),
                    );
                  }),
                  TextButton.icon(
                    onPressed: () {
                      setDialogState(() {
                        featureControllers.add(TextEditingController());
                      });
                    },
                    icon: const Icon(Icons.add),
                    label: const Text("Add Feature"),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Cancel"),
              ),
              ElevatedButton(
                onPressed: () async {
                  final title = titleController.text.trim();
                  final description = descriptionController.text.trim();
                  final price = double.tryParse(priceController.text.trim()) ?? 0.0;
                  final imageUrl = imageUrlController.text.trim();
                  final category = categoryController.text.trim();
                  final sessions = int.tryParse(sessionsController.text.trim()) ?? 1;
                  final visits = int.tryParse(visitsController.text.trim()) ?? 1;
                  
                  // Get key features
                  final keyFeatures = featureControllers
                      .map((c) => c.text.trim())
                      .where((text) => text.isNotEmpty)
                      .toList();

                  if (title.isEmpty || description.isEmpty || category.isEmpty) {
                    return;
                  }

                  final data = {
                    'title': title,
                    'description': description,
                    'price': price,
                    'imageUrl': imageUrl.isNotEmpty ? imageUrl : null,
                    'category': category,
                    'sessions': sessions,
                    'visitsPerSession': visits,
                    'keyFeatures': keyFeatures,
                  };

                  if (procedure == null) {
                    await _proceduresRef.add(data);
                  } else {
                    await _proceduresRef.doc(procedure.id).update(data);
                  }

                  if (mounted) Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                child: const Text("Save", style: TextStyle(color: Colors.white)),
              ),
            ],
          );
        },
      ),
    );
  }

  void _deleteProcedure(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Delete Procedure"),
        content: const Text("Are you sure you want to delete this procedure?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () async {
              await _proceduresRef.doc(id).delete();
              if (mounted) Navigator.pop(context);
            },
            child: const Text("Delete", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text("Manage Procedures", style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: AppColors.primary),
            onPressed: () => _showProcedureDialog(),
          ),
        ],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: _proceduresRef.snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final docs = snapshot.data?.docs ?? [];

          if (docs.isEmpty) {
            return const Center(child: Text("No procedures found."));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: docs.length,
            itemBuilder: (context, index) {
              final doc = docs[index];
              final procedure = ProcedureModel.fromMap(doc.data() as Map<String, dynamic>, doc.id);

              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  title: Text(procedure.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text("Category: ${procedure.category}", style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      const SizedBox(height: 4),
                      Text(procedure.description, maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Text(CurrencyConstants.formatCurrency(procedure.price, currencyCode: 'AED'), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                          const SizedBox(width: 16),
                          Text("${procedure.sessions} Sessions", style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          const SizedBox(width: 8),
                          Text("${procedure.visitsPerSession} Visits", style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                      if (procedure.keyFeatures.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text("${procedure.keyFeatures.length} key features", style: const TextStyle(fontSize: 11, color: AppColors.primary)),
                      ],
                    ],
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.blue),
                        onPressed: () => _showProcedureDialog(procedure: procedure),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => _deleteProcedure(procedure.id),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
