import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../widgets/bottom_nav_bar.dart';
import '../../services/chat_service.dart';
import 'dashboard.dart';
import '../procedures/procedures_list_screen.dart';
import '../chat/unified_chat_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _navIndex = 0; // Index for BottomNavigationBar (0-4)

  Future<void> _launchShopUrl() async {
    final Uri url = Uri.parse('https://5kassi.com/skinbyfizza/shop/');
    if (!await launchUrl(url, mode: LaunchMode.inAppWebView)) {
      throw Exception('Could not launch $url');
    }
  }

  void _onTabTapped(int index) {
    if (index == 2) { // Shop link
      _launchShopUrl();
      // Do not update state/index for external link
    } else {
      setState(() {
        _navIndex = index;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Map nav index to screen widget
    Widget currentScreen;
    switch (_navIndex) {
      case 0:
        currentScreen = const Dashboard();
        break;
      case 1:
        currentScreen = const ProceduresListScreen();
        break;
      // case 2 is Shop (external), no screen needed
      case 3:
        currentScreen = const UnifiedChatScreen();
        break;
      case 4:
        currentScreen = const ProfileScreen();
        break;
      default:
        currentScreen = const Dashboard();
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
            currentIndex: _navIndex,
            onTap: _onTabTapped,
            unreadCount: unreadCount,
            isAdmin: false, // User mode
          );
        },
      ),
    );
  }
}