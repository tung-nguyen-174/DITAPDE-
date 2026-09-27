import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'theme/app_theme.dart';
import 'providers/workout_provider.dart';
import 'providers/check_in_provider.dart';
import 'screens/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    debugPrint('Firebase initialization notice: $e');
  }

  final checkInProvider = CheckInProvider();
  await checkInProvider.loadSavedCheckIn();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => WorkoutProvider()),
        ChangeNotifierProvider<CheckInProvider>.value(value: checkInProvider),
      ],
      child: const GymChuotApp(),
    ),
  );
}

class GymChuotApp extends StatelessWidget {
  const GymChuotApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DiTapDe',
      debugShowCheckedModeBanner: false,
      theme: GymChuotTheme.darkTheme,
      home: const MainNavigationScreen(),
    );
  }
}
