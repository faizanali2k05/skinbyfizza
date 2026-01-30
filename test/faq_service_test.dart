import 'package:flutter_test/flutter_test.dart';
import 'package:skinbyfizza/services/faq_service.dart';
import 'package:skinbyfizza/models/faq_model.dart';

void main() {
  group('FaqService (local matching)', () {
    final faqs = [
      FaqModel(id: '1', question: 'When are you open?', keywords: ['time', 'timing'], answer: 'Open 9-5'),
      FaqModel(id: '2', question: 'Where is your location?', keywords: ['location', 'address'], answer: 'At 12-C, Lane 4'),
    ];

    test('returns greeting for hello', () async {
      final svc = FaqService(initialFaqs: faqs);
      final resp = await svc.getAnswer('Hello');
      expect(resp.toLowerCase(), contains('hello'));
    });

    test('matches keywords and returns appropriate answer', () async {
      final svc = FaqService(initialFaqs: faqs);
      final resp = await svc.getAnswer('What are your timings?');
      expect(resp, 'Open 9-5');
    });

    test('returns default when no match', () async {
      final svc = FaqService(initialFaqs: faqs);
      final resp = await svc.getAnswer('Do you offer pediatrics?');
      expect(resp, "Sorry, I don't have this information right now. Please contact the clinic.");
    });
  });
}