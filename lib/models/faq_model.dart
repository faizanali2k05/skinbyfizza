import 'package:cloud_firestore/cloud_firestore.dart';

class FaqModel {
  final String id;
  final String question;
  final String answer;
  final List<String> keywords;
  final String category;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  FaqModel({
    required this.id,
    required this.question,
    required this.answer,
    this.keywords = const [],
    this.category = 'general',
    this.createdAt,
    this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'question': question,
      'answer': answer,
      'keywords': keywords,
      'category': category,
      'createdAt': createdAt != null ? Timestamp.fromDate(createdAt!) : FieldValue.serverTimestamp(),
      'updatedAt': updatedAt != null ? Timestamp.fromDate(updatedAt!) : FieldValue.serverTimestamp(),
    };
  }

  factory FaqModel.fromMap(Map<String, dynamic> data, String id) {
    return FaqModel(
      id: id,
      question: data['question'] ?? '',
      answer: data['answer'] ?? '',
      keywords: List<String>.from(data['keywords'] ?? []),
      category: data['category'] ?? 'general',
      createdAt: data['createdAt'] != null ? (data['createdAt'] as Timestamp).toDate() : null,
      updatedAt: data['updatedAt'] != null ? (data['updatedAt'] as Timestamp).toDate() : null,
    );
  }

  factory FaqModel.fromSnapshot(DocumentSnapshot snapshot) {
    return FaqModel.fromMap(snapshot.data() as Map<String, dynamic>, snapshot.id);
  }
}
