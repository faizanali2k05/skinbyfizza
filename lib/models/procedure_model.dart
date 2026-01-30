import 'package:cloud_firestore/cloud_firestore.dart';

class ProcedureModel {
  final String id;
  final String title;
  final String name;
  final String description;
  final String category;
  final int duration; // in minutes
  final int sessions;
  final int visitsPerSession;
  final List<String> keyFeatures;
  final double price;
  final String imageUrl;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ProcedureModel({
    required this.id,
    this.title = '',
    required this.name,
    required this.description,
    this.category = 'GENERAL',
    this.duration = 0,
    this.sessions = 1,
    this.visitsPerSession = 1,
    this.keyFeatures = const [],
    this.price = 0.0,
    this.imageUrl = '',
    this.createdAt,
    this.updatedAt,
  });

  /// Convert to Firestore Map
  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'name': name,
      'description': description,
      'category': category,
      'duration': duration,
      'sessions': sessions,
      'visitsPerSession': visitsPerSession,
      'keyFeatures': keyFeatures,
      'price': price,
      'imageUrl': imageUrl,
      'createdAt': createdAt != null 
          ? Timestamp.fromDate(createdAt!) 
          : FieldValue.serverTimestamp(),
      'updatedAt': updatedAt != null 
          ? Timestamp.fromDate(updatedAt!) 
          : FieldValue.serverTimestamp(),
    };
  }

  /// Create from Firestore document
  factory ProcedureModel.fromMap(Map<String, dynamic> data, String documentId) {
    return ProcedureModel(
      id: documentId,
      title: data['title'] ?? data['name'] ?? '',
      name: data['name'] ?? '',
      description: data['description'] ?? '',
      category: data['category'] ?? 'GENERAL',
      duration: data['duration'] ?? 0,
      sessions: data['sessions'] ?? 1,
      visitsPerSession: data['visitsPerSession'] ?? 1,
      keyFeatures: List<String>.from(data['keyFeatures'] ?? []),
      price: (data['price'] ?? 0).toDouble(),
      imageUrl: data['imageUrl'] ?? '',
      createdAt: data['createdAt'] != null 
          ? (data['createdAt'] as Timestamp).toDate() 
          : null,
      updatedAt: data['updatedAt'] != null 
          ? (data['updatedAt'] as Timestamp).toDate() 
          : null,
    );
  }

  /// Create from snapshot
  factory ProcedureModel.fromSnapshot(DocumentSnapshot snapshot) {
    return ProcedureModel.fromMap(
      snapshot.data() as Map<String, dynamic>,
      snapshot.id,
    );
  }

  /// CopyWith method
  ProcedureModel copyWith({
    String? id,
    String? name,
    String? description,
    int? duration,
    double? price,
    String? imageUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ProcedureModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      duration: duration ?? this.duration,
      price: price ?? this.price,
      imageUrl: imageUrl ?? this.imageUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() => 'ProcedureModel(id: $id, name: $name, price: $price)';
}