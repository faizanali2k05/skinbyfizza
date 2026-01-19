class FaqModel {
  final String id;
  final List<String> keywords;
  final String answer;
  final String category;

  FaqModel({
    required this.id,
    required this.keywords,
    required this.answer,
    this.category = 'general',
  });

  factory FaqModel.fromMap(Map<String, dynamic> map, String id) {
    return FaqModel(
      id: id,
      keywords: List<String>.from(map['keywords'] ?? []),
      answer: map['answer'] ?? '',
      category: map['category'] ?? 'general',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'keywords': keywords,
      'answer': answer,
      'category': category,
    };
  }
}
