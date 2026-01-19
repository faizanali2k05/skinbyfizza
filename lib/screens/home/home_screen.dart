import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../widgets/bottom_nav_bar.dart';
import '../../services/chat_service.dart';
import 'dashboard.dart';
import '../procedures/procedures_list_screen.dart';
import '../chat/simple_chat_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  // Original screens structure: Home, Procedures, Shop (external), AI Chat, Profile
  final List<Widget> _screens = [
    const Dashboard(),
    const ProceduresListScreen(),
    const SimpleChatScreen(),
    const ProfileScreen(),
  ];

  Future<void> _launchShopUrl() async {
    final Uri url = Uri.parse('https://5kassi.com/skinbyfizza/shop/');
    if (!await launchUrl(url, mode: LaunchMode.inAppWebView)) {
      throw Exception('Could not launch $url');
    }
  }

  void _onTabTapped(int index) {
    if (index == 2) { // Shop tab is external link
      _launchShopUrl();
    } else {
      // Adjust index to account for the external shop tab not having a screen
      int adjustedIndex = index;
      if (index > 2) {
        adjustedIndex = index - 1; // Skip the external shop tab in our screens list
      }
      
      setState(() {
        _currentIndex = adjustedIndex;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget currentScreen;
    if (_currentIndex == 0) {
      currentScreen = _screens[0];
    } else if (_currentIndex == 1) {
      currentScreen = _screens[1];
    } else if (_currentIndex == 2) {
      currentScreen = _screens[2]; // AI Chat screen
    } else if (_currentIndex == 3) {
      currentScreen = _screens[3]; // Profile screen
    } else {
      currentScreen = _screens[0];
    }

    final userId = FirebaseAuth.instance.currentUser?.uid;

    return Scaffold(
      body: currentScreen,
      bottomNavigationBar: StreamBuilder<int>(
        stream: userId != null 
            ? ChatService().getUserUnreadCountStream(userId)
            : Stream.value(0),
        builder: (context, snapshot) {
          final unreadCount = snapshot.data ?? 0;
          return BottomNavBar(
            currentIndex: _currentIndex,
            onTap: _onTabTapped,
            unreadCount: unreadCount,
            isAdmin: false, // User mode
          );
        },
      ),
    );
  }
}