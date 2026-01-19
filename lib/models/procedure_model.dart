class ProcedureModel {
  final String id;
  final String title;
  final String description;
  final double price;
  final String? imageUrl;
  final String category;
  final List<String> keyFeatures;
  final int sessions;
  final int visitsPerSession;

  ProcedureModel({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    this.imageUrl,
    required this.category,
    this.keyFeatures = const [],
    this.sessions = 1,
    this.visitsPerSession = 1,
  });

  factory ProcedureModel.fromMap(Map<String, dynamic> data, String documentId) {
    return ProcedureModel(
      id: documentId,
      title: data['title'] ?? '',
      description: data['description'] ?? '',
      price: (data['price'] ?? 0).toDouble(),
      imageUrl: data['imageUrl'],
      category: data['category'] ?? '',
      keyFeatures: data['keyFeatures'] != null 
          ? List<String>.from(data['keyFeatures']) 
          : [],
      sessions: data['sessions'] ?? 1,
      visitsPerSession: data['visitsPerSession'] ?? 1,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'description': description,
      'price': price,
      'imageUrl': imageUrl,
      'category': category,
      'keyFeatures': keyFeatures,
      'sessions': sessions,
      'visitsPerSession': visitsPerSession,
    };
  }
}