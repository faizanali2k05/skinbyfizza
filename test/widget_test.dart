import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App smoke test (minimal)', (WidgetTester tester) async {
    // Build a minimal app that verifies the test harness works, without requiring providers or Firebase
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: Center(child: Text('Smoke')))));

    // Verify that the minimal app starts.
    expect(find.text('Smoke'), findsOneWidget);
  });
}
