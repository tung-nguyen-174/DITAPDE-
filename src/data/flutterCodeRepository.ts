export interface FlutterFile {
  path: string;
  name: string;
  category: 'config' | 'main' | 'theme' | 'models' | 'services' | 'providers' | 'screens' | 'widgets';
  description: string;
  code: string;
}

export const FLUTTER_PROJECT_FILES: FlutterFile[] = [
  {
    path: 'pubspec.yaml',
    name: 'pubspec.yaml',
    category: 'config',
    description: 'Flutter dependencies for Material 3, Provider, Firebase & animations',
    code: `name: gym_chuot
description: "Mạng xã hội thể hình và nhật ký tập luyện số 1 Việt Nam - Đi tập đê!"
publish_to: "none"
version: 1.0.0+1

environment:
  sdk: ">=3.2.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  path_provider: ^2.1.2
  share_plus: ^9.0.0
  provider: ^6.1.2
  google_fonts: ^6.1.0
  firebase_core: ^3.0.0
  firebase_messaging: ^15.0.0
  cloud_firestore: ^5.0.0
  firebase_auth: ^5.0.0
  cloud_functions: ^5.0.0
  google_sign_in: ^6.2.1
  sign_in_with_apple: ^6.1.0
  http: ^1.2.0
  intl: ^0.19.0
  lucide_icons: ^0.257.0
  cached_network_image: ^3.3.1
  audioplayers: ^5.2.1
  flutter_svg: ^2.0.10+1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/data/
`,
  },
  {
    path: 'lib/theme/app_theme.dart',
    name: 'app_theme.dart',
    category: 'theme',
    description: 'Gym Chuột Material 3 Theme (Deep Dark #121212, Surface #1E1E1E, Input #2A2A2A, Accent #FF5722)',
    code: `import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class GymChuotTheme {
  // Material 3 Dark Mode Surface & Brand Tokens
  static const Color chalkOrange = Color(0xFFFF5722);
  static const Color electricCyan = Color(0xFF00E5FF);
  static const Color ironBlack = Color(0xFF121212);
  static const Color surfaceCard = Color(0xFF1E1E1E);
  static const Color inputSurface = Color(0xFF2A2A2A);
  static const Color steelGray = Color(0xFF1E1E1E);
  static const Color pureWhite = Colors.white;
  static const Color mutedSilver = Colors.white54;
  static const Color successGreen = Color(0xFF10B981);

  static ThemeData get darkTheme {
    final textTheme = GoogleFonts.beVietnamProTextTheme(
      ThemeData.dark().textTheme,
    ).copyWith(
      headlineSmall: GoogleFonts.beVietnamPro(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: Colors.white,
      ),
      titleLarge: GoogleFonts.beVietnamPro(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: Colors.white,
      ),
      titleMedium: GoogleFonts.beVietnamPro(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
      bodyMedium: GoogleFonts.beVietnamPro(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: Colors.white70,
      ),
      bodySmall: GoogleFonts.beVietnamPro(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: Colors.white54,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: ironBlack,
      primaryColor: chalkOrange,
      colorScheme: const ColorScheme.dark(
        primary: chalkOrange,
        secondary: electricCyan,
        surface: surfaceCard,
        onPrimary: Colors.white,
        onSecondary: ironBlack,
        onSurface: Colors.white,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: surfaceCard,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.beVietnamPro(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      cardTheme: CardTheme(
        color: surfaceCard,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: Colors.white.withOpacity(0.08), width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: inputSurface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: chalkOrange, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: chalkOrange,
          foregroundColor: Colors.white,
          minimumSize: const Size(48, 48),
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.beVietnamPro(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),
      textTheme: textTheme,
    );
  }
}
`,
  },
  {
    path: 'lib/models/exercise_model.dart',
    name: 'exercise_model.dart',
    category: 'models',
    description: 'Data models for Exercise Sets, Muscle Groups & Telemetry Calculations',
    code: `enum MuscleGroup {
  chest,
  frontDelts,
  sideDelts,
  rearDelts,
  triceps,
  biceps,
  lats,
  upperBack,
  lowerBack,
  abs,
  quads,
  hamstrings,
  glutes,
  calves,
}

enum SetType {
  warmup,
  normal,
  drop,
  failure,
}

class ExerciseSet {
  final String id;
  final int setNumber;
  final SetType setType;
  final String previous;
  double weight;
  int reps;
  double rpe;
  bool isCompleted;

  ExerciseSet({
    required this.id,
    required this.setNumber,
    this.setType = SetType.normal,
    this.previous = '-',
    required this.weight,
    required this.reps,
    this.rpe = 8.0,
    this.isCompleted = false,
  });

  // PRD E1RM Formula: Weight * (1 + (Reps + (10 - RPE)) / 30)
  double get calculatedE1RM {
    if (weight <= 0 || reps <= 0) return 0.0;
    return weight * (1.0 + (reps + (10.0 - rpe)) / 30.0);
  }

  double get volume => weight * reps;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'setNumber': setNumber,
      'setType': setType.name,
      'previous': previous,
      'weight': weight,
      'reps': reps,
      'rpe': rpe,
      'isCompleted': isCompleted,
    };
  }
}

class WorkoutExercise {
  final String id;
  final String name;
  final String vietnameseName;
  final MuscleGroup primaryMuscle;
  final List<MuscleGroup> secondaryMuscles;
  final List<ExerciseSet> sets;

  WorkoutExercise({
    required this.id,
    required this.name,
    required this.vietnameseName,
    required this.primaryMuscle,
    this.secondaryMuscles = const [],
    required this.sets,
  });

  double get totalVolume {
    return sets
        .where((s) => s.isCompleted)
        .fold(0.0, (acc, s) => acc + s.volume);
  }

  int get completedSetsCount {
    return sets.where((s) => s.isCompleted).length;
  }
}
`,
  },
  {
    path: 'lib/models/workout_model.dart',
    name: 'workout_model.dart',
    category: 'models',
    description: 'Post-workout session data model with telemetry summaries & social feeds',
    code: `import 'exercise_model.dart';

class WorkoutSession {
  final String id;
  String title;
  final DateTime startTime;
  DateTime? endTime;
  int durationSeconds;
  final List<WorkoutExercise> exercises;
  String gymVenue;
  String notes;
  String visibility; // 'public', 'friends', 'private'
  bool telemetryOverlay;
  String? mediaUrl;

  WorkoutSession({
    required this.id,
    required this.title,
    required this.startTime,
    this.endTime,
    this.durationSeconds = 0,
    required this.exercises,
    this.gymVenue = 'California Fitness Thanh Hóa',
    this.notes = '',
    this.visibility = 'public',
    this.telemetryOverlay = true,
    this.mediaUrl,
  });

  double get totalTonnageKg {
    return exercises.fold(0.0, (sum, ex) => sum + ex.totalVolume);
  }

  int get totalCompletedSets {
    return exercises.fold(0, (sum, ex) => sum + ex.completedSetsCount);
  }

  Map<MuscleGroup, int> get muscleSetsDistribution {
    final Map<MuscleGroup, int> map = {};
    for (final ex in exercises) {
      final count = ex.completedSetsCount;
      if (count > 0) {
        map[ex.primaryMuscle] = (map[ex.primaryMuscle] ?? 0) + count;
      }
    }
    return map;
  }
}

class FeedPost {
  final String id;
  final String userId;
  final String userName;
  final String userAvatar;
  final String userGym;
  final String timestamp;
  final String title;
  final int durationMinutes;
  final double totalTonnageKg;
  final int totalSets;
  final String? prHighlight;
  final String caption;
  int dapsCount;
  bool isDapped;
  final int commentsCount;
  int forkCount;
  final Map<MuscleGroup, int> muscleVolumeMap;
  final String? mediaUrl;
  final String? telemetrySnippet;

  FeedPost({
    required this.id,
    required this.userId,
    required this.userName,
    required this.userAvatar,
    required this.userGym,
    required this.timestamp,
    required this.title,
    required this.durationMinutes,
    required this.totalTonnageKg,
    required this.totalSets,
    this.prHighlight,
    required this.caption,
    this.dapsCount = 0,
    this.isDapped = false,
    this.commentsCount = 0,
    this.forkCount = 0,
    this.muscleVolumeMap = const {},
    this.mediaUrl,
    this.telemetrySnippet,
  });
}
`,
  },
  {
    path: 'lib/services/firebase_service.dart',
    name: 'firebase_service.dart',
    category: 'services',
    description: 'Firebase Firestore & FCM integration without hardcoded secrets',
    code: `import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/workout_model.dart';

class FirebaseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String? get currentUserId => _auth.currentUser?.uid;

  /// Lưu workout session sau khi hoàn thành
  Future<void> saveWorkoutSession(WorkoutSession session) async {
    final uid = currentUserId ?? 'guest_user';
    final batch = _firestore.batch();

    // 1. Lưu vào /users/{id}/workouts/{workoutId}
    final userWorkoutRef = _firestore
        .collection('users')
        .doc(uid)
        .collection('workouts')
        .doc(session.id);

    batch.set(userWorkoutRef, {
      'title': session.title,
      'startTime': session.startTime.toIso8601String(),
      'endTime': session.endTime?.toIso8601String() ?? DateTime.now().toIso8601String(),
      'durationSeconds': session.durationSeconds,
      'gymVenue': session.gymVenue,
      'totalTonnageKg': session.totalTonnageKg,
      'totalSets': session.totalCompletedSets,
      'notes': session.notes,
      'visibility': session.visibility,
      'createdAt': FieldValue.serverTimestamp(),
    });

    // 2. Publish vào /feed/ nếu công khai
    if (session.visibility != 'private') {
      final feedRef = _firestore.collection('feed').doc(session.id);
      batch.set(feedRef, {
        'userId': uid,
        'userName': _auth.currentUser?.displayName ?? 'Chuột Gymmer',
        'userGym': session.gymVenue,
        'title': session.title,
        'totalTonnageKg': session.totalTonnageKg,
        'totalSets': session.totalCompletedSets,
        'durationMinutes': (session.durationSeconds / 60).round(),
        'caption': session.notes.isNotEmpty ? session.notes : 'Đã hoàn thành buổi tập!',
        'dapsCount': 0,
        'forkCount': 0,
        'timestamp': DateTime.now().toIso8601String(),
      });
    }

    await batch.commit();
  }

  /// Tăng số lượt Daps (+1 Flexed Bicep)
  Future<void> toggleDap(String postId, bool isDapped) async {
    final postRef = _firestore.collection('feed').doc(postId);
    await postRef.update({
      'dapsCount': FieldValue.increment(isDapped ? 1 : -1),
    });
  }

  /// Gửi Nudge "Đi tập đê!" thông qua cloud trigger / FCM
  Future<void> sendNudge({
    required String targetUserId,
    required String senderName,
    String? customMessage,
  }) async {
    await _firestore.collection('nudges').add({
      'targetUserId': targetUserId,
      'senderName': senderName,
      'message': customMessage ?? 'Đi tập đê!',
      'timestamp': FieldValue.serverTimestamp(),
      'status': 'sent',
    });
  }
}
`,
  },
  {
    path: 'lib/providers/workout_provider.dart',
    name: 'workout_provider.dart',
    category: 'providers',
    description: 'Central State Management for Active Logger, Rest Timer, Daps & Nudges',
    code: `import 'dart:async';
import 'package:flutter/material.dart';
import '../models/exercise_model.dart';
import '../models/workout_model.dart';
import '../services/firebase_service.dart';

class WorkoutProvider with ChangeNotifier {
  final FirebaseService _firebaseService = FirebaseService();

  // Active Logger State
  WorkoutSession? _activeSession;
  Timer? _stopwatchTimer;
  Timer? _restTimer;
  int _restSecondsRemaining = 0;
  bool _isRestTimerActive = false;

  // Streak & User Profile
  int weeklyStreak = 6;
  double monthlyTonnageKg = 46800.0;
  String currentGym = 'California Fitness Thanh Hóa';

  WorkoutSession? get activeSession => _activeSession;
  bool get hasActiveSession => _activeSession != null;
  int get restSecondsRemaining => _restSecondsRemaining;
  bool get isRestTimerActive => _isRestTimerActive;

  // Bắt đầu buổi tập mới ("Tập Ngay")
  void startNewWorkout({String title = 'Upper Hypertrophy A'}) {
    _activeSession = WorkoutSession(
      id: 'session_\${DateTime.now().millisecondsSinceEpoch}',
      title: title,
      startTime: DateTime.now(),
      exercises: [
        WorkoutExercise(
          id: 'ex_1',
          name: 'Barbell Bench Press',
          vietnameseName: 'Đẩy ngực ngang đòn tạ',
          primaryMuscle: MuscleGroup.chest,
          secondaryMuscles: [MuscleGroup.triceps, MuscleGroup.frontDelts],
          sets: [
            ExerciseSet(
              id: 'set_1_1',
              setNumber: 1,
              setType: SetType.warmup,
              previous: '60kg x 10',
              weight: 60.0,
              reps: 10,
              rpe: 7.0,
            ),
            ExerciseSet(
              id: 'set_1_2',
              setNumber: 2,
              setType: SetType.normal,
              previous: '100kg x 6',
              weight: 100.0,
              reps: 6,
              rpe: 8.5,
            ),
            ExerciseSet(
              id: 'set_1_3',
              setNumber: 3,
              setType: SetType.normal,
              previous: '120kg x 3',
              weight: 120.0,
              reps: 5,
              rpe: 9.0,
            ),
          ],
        ),
        WorkoutExercise(
          id: 'ex_2',
          name: 'Incline Dumbbell Press',
          vietnameseName: 'Đẩy ngực dốc tạ đơn',
          primaryMuscle: MuscleGroup.chest,
          secondaryMuscles: [MuscleGroup.frontDelts, MuscleGroup.triceps],
          sets: [
            ExerciseSet(
              id: 'set_2_1',
              setNumber: 1,
              setType: SetType.normal,
              previous: '32kg x 10',
              weight: 34.0,
              reps: 8,
              rpe: 8.0,
            ),
            ExerciseSet(
              id: 'set_2_2',
              setNumber: 2,
              setType: SetType.normal,
              previous: '34kg x 8',
              weight: 36.0,
              reps: 8,
              rpe: 9.0,
            ),
          ],
        ),
      ],
    );

    _startStopwatch();
    notifyListeners();
  }

  void _startStopwatch() {
    _stopwatchTimer?.cancel();
    _stopwatchTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_activeSession != null) {
        _activeSession!.durationSeconds++;
        notifyListeners();
      }
    });
  }

  // Tích hoàn thành set [ ✓ ]
  void toggleSetComplete(int exerciseIndex, int setIndex) {
    if (_activeSession == null) return;
    final set = _activeSession!.exercises[exerciseIndex].sets[setIndex];
    set.isCompleted = !set.isCompleted;

    if (set.isCompleted) {
      startRestTimer(90); // Mặc định 90s nghỉ
    }

    notifyListeners();
  }

  // Cập nhật thông số set
  void updateSetWeight(int exerciseIndex, int setIndex, double weight) {
    if (_activeSession == null) return;
    _activeSession!.exercises[exerciseIndex].sets[setIndex].weight = weight;
    notifyListeners();
  }

  void updateSetReps(int exerciseIndex, int setIndex, int reps) {
    if (_activeSession == null) return;
    _activeSession!.exercises[exerciseIndex].sets[setIndex].reps = reps;
    notifyListeners();
  }

  void updateSetRPE(int exerciseIndex, int setIndex, double rpe) {
    if (_activeSession == null) return;
    _activeSession!.exercises[exerciseIndex].sets[setIndex].rpe = rpe;
    notifyListeners();
  }

  void addSet(int exerciseIndex) {
    if (_activeSession == null) return;
    final ex = _activeSession!.exercises[exerciseIndex];
    final lastSet = ex.sets.isNotEmpty ? ex.sets.last : null;
    ex.sets.add(ExerciseSet(
      id: 'set_\${DateTime.now().millisecondsSinceEpoch}',
      setNumber: ex.sets.length + 1,
      setType: SetType.normal,
      previous: lastSet != null ? '\${lastSet.weight}kg x \${lastSet.reps}' : '-',
      weight: lastSet?.weight ?? 60.0,
      reps: lastSet?.reps ?? 8,
      rpe: 8.0,
    ));
    notifyListeners();
  }

  // Đồng hồ nghỉ (Rest Timer)
  void startRestTimer(int seconds) {
    _restSecondsRemaining = seconds;
    _isRestTimerActive = true;
    _restTimer?.cancel();

    _restTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_restSecondsRemaining > 0) {
        _restSecondsRemaining--;
        notifyListeners();
      } else {
        skipRestTimer();
      }
    });
    notifyListeners();
  }

  void addRestSeconds(int seconds) {
    _restSecondsRemaining += seconds;
    notifyListeners();
  }

  void skipRestTimer() {
    _restTimer?.cancel();
    _isRestTimerActive = false;
    _restSecondsRemaining = 0;
    notifyListeners();
  }

  // Hoàn thành buổi tập
  Future<void> finishWorkout() async {
    if (_activeSession == null) return;
    _stopwatchTimer?.cancel();
    _restTimer?.cancel();
    _activeSession!.endTime = DateTime.now();

    monthlyTonnageKg += _activeSession!.totalTonnageKg;
    await _firebaseService.saveWorkoutSession(_activeSession!);
    
    _activeSession = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _stopwatchTimer?.cancel();
    _restTimer?.cancel();
    super.dispose();
  }
}
`,
  },
  {
    path: 'lib/screens/main_navigation_screen.dart',
    name: 'main_navigation_screen.dart',
    category: 'screens',
    description: 'Main App Scaffold with 4 Bottom Tabs and Centered FAB "Tập Ngay"',
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';
import '../providers/workout_provider.dart';
import 'feed_screen.dart';
import 'discover_screen.dart';
import 'challenges_screen.dart';
import 'profile_screen.dart';
import 'active_logger_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    FeedScreen(),
    DiscoverScreen(),
    ChallengesScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkoutProvider>();

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: GymChuotTheme.chalkOrange,
        foregroundColor: GymChuotTheme.pureWhite,
        elevation: 6,
        onPressed: () {
          if (!provider.hasActiveSession) {
            provider.startNewWorkout();
          }
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (ctx) => const ActiveLoggerScreen(),
              fullscreenDialog: true,
            ),
          );
        },
        icon: const Icon(LucideIcons.dumbbell, size: 20),
        label: Text(
          provider.hasActiveSession ? 'ĐANG TẬP' : 'TẬP NGAY',
          style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.5),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        backgroundColor: GymChuotTheme.ironBlack,
        indicatorColor: GymChuotTheme.chalkOrange.withOpacity(0.2),
        elevation: 10,
        height: 68,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(LucideIcons.flame, color: GymChuotTheme.mutedSilver),
            selectedIcon: Icon(LucideIcons.flame, color: GymChuotTheme.chalkOrange),
            label: 'Bảng Tin',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.compass, color: GymChuotTheme.mutedSilver),
            selectedIcon: Icon(LucideIcons.compass, color: GymChuotTheme.electricCyan),
            label: 'Khám Phá',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.trophy, color: GymChuotTheme.mutedSilver),
            selectedIcon: Icon(LucideIcons.trophy, color: GymChuotTheme.chalkOrange),
            label: 'Thử Thách',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.user, color: GymChuotTheme.mutedSilver),
            selectedIcon: Icon(LucideIcons.user, color: GymChuotTheme.pureWhite),
            label: 'Cá Nhân',
          ),
        ],
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/screens/feed_screen.dart',
    name: 'feed_screen.dart',
    category: 'screens',
    description: 'Social Feed with Gym Buddies Nudge Strip, Anatomical Muscle Heatmap & Daps',
    code: `import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';
import '../widgets/dap_button.dart';
import '../widgets/nudge_modal.dart';
import '../widgets/muscle_heatmap_widget.dart';
import '../models/exercise_model.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  int _activeCardView = 0; // 0 = Muscle Heatmap, 1 = Media Telemetry

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: GymChuotTheme.chalkOrange,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'GYM CHUỘT',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber.withOpacity(0.3)),
              ),
              child: const Row(
                children: [
                  Icon(LucideIcons.flame, color: Colors.amber, size: 14),
                  SizedBox(width: 4),
                  Text(
                    'Chuỗi 6 Tuần',
                    style: TextStyle(color: Colors.amber, fontSize: 11, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.bell, size: 20),
            onPressed: () {},
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 90),
        children: [
          // 1. Gym Buddies "Đi tập đê!" Strip
          _buildBuddiesStrip(context),

          const SizedBox(height: 12),

          // 2. Workout Feed Post Card
          _buildSamplePostCard(context),
        ],
      ),
    );
  }

  Widget _buildBuddiesStrip(BuildContext context) {
    final buddies = [
      {'name': 'Long Aura', 'status': 'Đang tập', 'isOnline': true},
      {'name': 'Như Cute', 'status': 'Nghỉ ngơi', 'isOnline': false},
      {'name': 'Anh Kiên', 'status': 'Chuỗi 4T', 'isOnline': true},
      {'name': 'Tùng Deadlift', 'status': 'Nghỉ ngơi', 'isOnline': false},
    ];

    return Container(
      height: 110,
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: const BoxDecoration(
        color: GymChuotTheme.steelGray,
        border: Border(bottom: BorderSide(color: Color(0xFF2E2E36))),
      ),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: buddies.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (ctx, i) {
          final b = buddies[i];
          return GestureDetector(
            onTap: () => showModalBottomSheet(
              context: context,
              backgroundColor: Colors.transparent,
              builder: (c) => NudgeModal(buddyName: b['name'] as String),
            ),
            child: Column(
              children: [
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: GymChuotTheme.chalkOrange,
                      child: CircleAvatar(
                        radius: 24,
                        backgroundColor: const Color(0xFF26262B),
                        child: Text(
                          (b['name'] as String).substring(0, 2).toUpperCase(),
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ),
                    if (b['isOnline'] as bool)
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          width: 14,
                          height: 14,
                          decoration: BoxDecoration(
                            color: GymChuotTheme.successGreen,
                            shape: BoxShape.circle,
                            border: Border.all(color: GymChuotTheme.ironBlack, width: 2),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  b['name'] as String,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                ),
                Text(
                  b['status'] as String,
                  style: const TextStyle(fontSize: 9, color: GymChuotTheme.mutedSilver),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSamplePostCard(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Card Header
            Row(
              children: [
                const CircleAvatar(
                  radius: 20,
                  backgroundColor: GymChuotTheme.chalkOrange,
                  child: Text('LA', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Long Aura (PT Pro)', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      Text('📍 California Fitness Thanh Hóa • 18 phút trước', style: TextStyle(fontSize: 11, color: GymChuotTheme.mutedSilver)),
                    ],
                  ),
                ),
                IconButton(icon: const Icon(LucideIcons.moreVertical, size: 18), onPressed: () {}),
              ],
            ),
            const SizedBox(height: 12),

            // Workout Title & PR Badge
            const Text(
              'Upper Body Hypertrophy & PR Push Day 🔥',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: GymChuotTheme.chalkOrange.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: GymChuotTheme.chalkOrange.withOpacity(0.4)),
              ),
              child: const Text(
                '🏆 PR Mới: Bench Press 120kg x 5 (E1RM 138kg)',
                style: TextStyle(color: GymChuotTheme.chalkOrange, fontSize: 12, fontWeight: FontWeight.w700),
              ),
            ),

            const SizedBox(height: 14),

            // Telemetry Matrix Bar
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: GymChuotTheme.ironBlack,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _MetricItem(label: 'TỔNG TẢI TRỌNG', value: '8,450 kg'),
                  _MetricItem(label: 'TỔNG SETS', value: '18 Sets'),
                  _MetricItem(label: 'THỜI GIAN', value: '62 Phút'),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Toggleable Visual Content Centerpiece: Tab A (Heatmap) / Tab B (Media Overlay)
            Container(
              decoration: BoxDecoration(
                color: GymChuotTheme.ironBlack,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF2A2A32)),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _activeCardView = 0),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              border: Border(
                                bottom: BorderSide(
                                  color: _activeCardView == 0 ? GymChuotTheme.chalkOrange : Colors.transparent,
                                  width: 2,
                                ),
                              ),
                            ),
                            child: Center(
                              child: Text(
                                'Anatomical Heatmap',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: _activeCardView == 0 ? GymChuotTheme.chalkOrange : GymChuotTheme.mutedSilver,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _activeCardView = 1),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              border: Border(
                                bottom: BorderSide(
                                  color: _activeCardView == 1 ? GymChuotTheme.electricCyan : Colors.transparent,
                                  width: 2,
                                ),
                              ),
                            ),
                            child: Center(
                              child: Text(
                                'Lift Telemetry Clip',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: _activeCardView == 1 ? GymChuotTheme.electricCyan : GymChuotTheme.mutedSilver,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: _activeCardView == 0
                        ? const MuscleHeatmapWidget(
                            highlightedMuscles: {
                              MuscleGroup.chest: 10,
                              MuscleGroup.triceps: 6,
                              MuscleGroup.frontDelts: 4,
                            },
                          )
                        : Container(
                            height: 180,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E1E24),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(LucideIcons.video, color: GymChuotTheme.electricCyan, size: 36),
                                const SizedBox(height: 8),
                                const Text(
                                  'BENCH PRESS 120KG × 5 REPS',
                                  style: TextStyle(fontWeight: FontWeight.w900, color: GymChuotTheme.electricCyan),
                                ),
                                Text(
                                  'RPE 9.0 • Tốc độ 0.38 m/s • Tải 3,400 kg',
                                  style: TextStyle(color: GymChuotTheme.mutedSilver.withOpacity(0.8), fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),
            const Text(
              'Hôm nay ngực căng tràn! Set 120kg nhẹ như lông hồng nhờ có anh em hô Đi tập đê!',
              style: TextStyle(fontSize: 13, height: 1.4),
            ),

            const Divider(color: Color(0xFF2E2E36), height: 24),

            // Card Action Buttons: Daps, Comment, Share & Fork Routine
            Row(
              children: [
                const DapButton(initialCount: 42),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: () {},
                  icon: const Icon(LucideIcons.messageSquare, size: 16, color: GymChuotTheme.mutedSilver),
                  label: const Text('9', style: TextStyle(color: GymChuotTheme.mutedSilver, fontSize: 13)),
                ),
                const Spacer(),
                OutlinedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Đã sao chép lịch tập (Fork Routine) vào danh sách của bạn!'),
                        backgroundColor: GymChuotTheme.electricCyan,
                      ),
                    );
                  },
                  icon: const Icon(LucideIcons.gitFork, size: 14, color: GymChuotTheme.electricCyan),
                  label: const Text('Fork Routine', style: TextStyle(color: GymChuotTheme.electricCyan, fontSize: 12)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: GymChuotTheme.electricCyan),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricItem extends StatelessWidget {
  final String label;
  final String value;
  const _MetricItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 9, color: GymChuotTheme.mutedSilver, fontWeight: FontWeight.w700)),
        const SizedBox(height: 3),
        Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: GymChuotTheme.pureWhite)),
      ],
    );
  }
}
`,
  },
  {
    path: 'lib/screens/active_logger_screen.dart',
    name: 'active_logger_screen.dart',
    category: 'screens',
    description: 'Active Workout Telemetry Logger with ValidatedSetRow, Material 3 8dp Spacing & Plate Calculator',
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';
import '../models/exercise_model.dart';
import '../providers/workout_provider.dart';
import '../widgets/plate_calculator_dialog.dart';
import '../widgets/rest_timer_sheet.dart';
import 'summary_screen.dart';

class ActiveLoggerScreen extends StatelessWidget {
  const ActiveLoggerScreen({super.key});

  String _formatDuration(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkoutProvider>();
    final session = provider.activeSession;

    if (session == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF121212),
        body: Center(
          child: ElevatedButton(
            onPressed: () => provider.startNewWorkout(),
            child: const Text('Bắt đầu buổi tập mới'),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E1E1E),
        leading: IconButton(
          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
          icon: const Icon(LucideIcons.x, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              session.title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white),
            ),
            const SizedBox(height: 2),
            Row(
              children: [
                const Icon(LucideIcons.clock, size: 13, color: Color(0xFFFF5722)),
                const SizedBox(width: 8),
                Text(
                  _formatDuration(session.durationSeconds),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFFF5722),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (ctx) => const SummaryScreen(),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF5722),
              minimumSize: const Size(48, 48),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            child: const Text('Hoàn Thành', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Stack(
        children: [
          // 1. SPACING & PADDING: Screen Margins EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0)
          ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0).copyWith(bottom: 140),
            itemCount: session.exercises.length,
            separatorBuilder: (_, __) => const SizedBox(height: 16),
            itemBuilder: (ctx, exIdx) {
              final ex = session.exercises[exIdx];
              return Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E1E),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withOpacity(0.08)),
                ),
                // Card Padding: EdgeInsets.all(16.0)
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Exercise Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                ex.name,
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: Colors.white),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                ex.vietnameseName,
                                style: const TextStyle(fontSize: 12, color: Colors.white54),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        IconButton(
                          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                          icon: const Icon(LucideIcons.disc, color: Color(0xFFFF5722), size: 20),
                          tooltip: 'Tính bánh tạ (Plate Calculator)',
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (c) => const PlateCalculatorDialog(initialTargetKg: 100),
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Set Table Header
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4.0),
                      child: Row(
                        children: [
                          SizedBox(width: 40, child: Text('SET', style: TextStyle(fontSize: 12, color: Colors.white54))),
                          Expanded(child: Text('TRƯỚC', style: TextStyle(fontSize: 12, color: Colors.white54))),
                          SizedBox(width: 68, child: Center(child: Text('KG', style: TextStyle(fontSize: 12, color: Colors.white54)))),
                          SizedBox(width: 8),
                          SizedBox(width: 60, child: Center(child: Text('REPS', style: TextStyle(fontSize: 12, color: Colors.white54)))),
                          SizedBox(width: 8),
                          SizedBox(width: 56, child: Center(child: Text('RPE', style: TextStyle(fontSize: 12, color: Colors.white54)))),
                          SizedBox(width: 8),
                          SizedBox(width: 48, child: Center(child: Text('XONG', style: TextStyle(fontSize: 12, color: Colors.white54)))),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Validated Sets List with SizedBox(height: 12) between items
                    ...List.generate(ex.sets.length, (sIdx) {
                      final set = ex.sets[sIdx];
                      return Padding(
                        padding: EdgeInsets.only(bottom: sIdx < ex.sets.length - 1 ? 12.0 : 0.0),
                        child: ValidatedSetRow(
                          set: set,
                          exIdx: exIdx,
                          sIdx: sIdx,
                          provider: provider,
                        ),
                      );
                    }),

                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () => provider.addSet(exIdx),
                      icon: const Icon(LucideIcons.plus, size: 16, color: Color(0xFFFF5722)),
                      label: const Text('Thêm Set Mới', style: TextStyle(fontSize: 14, color: Color(0xFFFF5722))),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(48, 48),
                        side: BorderSide(color: Colors.white.withOpacity(0.08)),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),

          // Sticky Bottom Drawer
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (provider.isRestTimerActive)
                  RestTimerSheet(
                    secondsRemaining: provider.restSecondsRemaining,
                    onAdd30s: () => provider.addRestSeconds(30),
                    onSkip: () => provider.skipRestTimer(),
                  ),
                Container(
                  color: const Color(0xFF1E1E1E),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.activity, color: Color(0xFFFF5722), size: 18),
                      const SizedBox(width: 8),
                      const Text(
                        'Live Heatmap: Ngực 8 Sets · Tay Sau 4 Sets',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: Colors.white70),
                      ),
                      const Spacer(),
                      Text(
                        'Tải: \${session.totalTonnageKg.toStringAsFixed(0)} kg',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFFFF5722)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ValidatedSetRow extends StatefulWidget {
  final ExerciseSet set;
  final int exIdx;
  final int sIdx;
  final WorkoutProvider provider;

  const ValidatedSetRow({
    super.key,
    required this.set,
    required this.exIdx,
    required this.sIdx,
    required this.provider,
  });

  @override
  State<ValidatedSetRow> createState() => _ValidatedSetRowState();
}

class _ValidatedSetRowState extends State<ValidatedSetRow> {
  String? _errorMessage;

  void _validateAndUpdateWeight(String val) {
    final w = double.tryParse(val);
    if (w == null || w < 0) {
      setState(() => _errorMessage = 'Mức tạ không hợp lệ (≥ 0kg)');
      return;
    }
    if (w > 500) {
      setState(() => _errorMessage = 'Mức tạ vượt giới hạn (> 500kg đã bị chặn)');
      return;
    }
    setState(() => _errorMessage = null);
    widget.provider.updateSetWeight(widget.exIdx, widget.sIdx, w);
  }

  void _validateAndUpdateReps(String val) {
    final r = int.tryParse(val);
    if (r == null || r < 0) {
      setState(() => _errorMessage = 'Số reps không hợp lệ (≥ 0)');
      return;
    }
    if (r > 100) {
      setState(() => _errorMessage = 'Số reps vượt giới hạn (> 100 đã bị chặn)');
      return;
    }
    setState(() => _errorMessage = null);
    widget.provider.updateSetReps(widget.exIdx, widget.sIdx, r);
  }

  void _validateAndUpdateRpe(String val) {
    final rpe = double.tryParse(val);
    if (rpe == null || rpe < 1) {
      setState(() => _errorMessage = 'RPE tối thiểu là 1.0');
      return;
    }
    if (rpe > 10) {
      setState(() => _errorMessage = 'Chỉ số RPE vượt giới hạn (> 10 đã bị chặn)');
      return;
    }
    setState(() => _errorMessage = null);
    widget.provider.updateSetRPE(widget.exIdx, widget.sIdx, rpe);
  }

  @override
  Widget build(BuildContext context) {
    final set = widget.set;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Table Rows: EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0)
        Container(
          padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
          decoration: BoxDecoration(
            color: _errorMessage != null
                ? Colors.redAccent.withOpacity(0.12)
                : set.isCompleted
                    ? const Color(0xFF10B981).withOpacity(0.12)
                    : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: _errorMessage != null
                  ? Colors.redAccent
                  : Colors.white.withOpacity(0.08),
            ),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 40,
                child: Text(
                  'H\${set.setNumber}',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Colors.white),
                ),
              ),
              Expanded(
                child: Text(
                  set.previous,
                  style: const TextStyle(fontSize: 12, color: Colors.white54),
                ),
              ),
              SizedBox(
                width: 68,
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF2A2A2A),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: TextFormField(
                    initialValue: set.weight.toStringAsFixed(1),
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: Colors.white),
                    decoration: const InputDecoration(
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      isDense: true,
                      border: InputBorder.none,
                    ),
                    onChanged: _validateAndUpdateWeight,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 60,
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF2A2A2A),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: TextFormField(
                    initialValue: set.reps.toString(),
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: Colors.white),
                    decoration: const InputDecoration(
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      isDense: true,
                      border: InputBorder.none,
                    ),
                    onChanged: _validateAndUpdateReps,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 56,
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF2A2A2A),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: TextFormField(
                    initialValue: set.rpe.toStringAsFixed(1),
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: Colors.white),
                    decoration: const InputDecoration(
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      isDense: true,
                      border: InputBorder.none,
                    ),
                    onChanged: _validateAndUpdateRpe,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 48,
                height: 48,
                child: IconButton(
                  constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                  icon: Icon(
                    set.isCompleted ? LucideIcons.checkCircle : LucideIcons.circle,
                    color: set.isCompleted ? const Color(0xFFFF5722) : Colors.white54,
                    size: 22,
                  ),
                  onPressed: () {
                    if (_errorMessage == null) {
                      widget.provider.toggleSetComplete(widget.exIdx, widget.sIdx);
                    }
                  },
                ),
              ),
            ],
          ),
        ),
        if (_errorMessage != null)
          Padding(
            padding: const EdgeInsets.only(top: 6.0, left: 4.0),
            child: Text(
              _errorMessage!,
              style: const TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ),
      ],
    );
  }
}
`,
  },
  {
    path: 'lib/screens/summary_screen.dart',
    name: 'summary_screen.dart',
    category: 'screens',
    description: 'Post-Workout Summary ("Báo Cáo Session") with PR Celebration & Publish',
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';
import '../providers/workout_provider.dart';

class SummaryScreen extends StatefulWidget {
  const SummaryScreen({super.key});

  @override
  State<SummaryScreen> createState() => _SummaryScreenState();
}

class _SummaryScreenState extends State<SummaryScreen> {
  final TextEditingController _captionController = TextEditingController(
    text: 'Đẩy ngực hôm nay quá đã! Set 120kg nhẹ như lông hồng!',
  );
  String _visibility = 'public';
  bool _burnTelemetryOverlay = true;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WorkoutProvider>();
    final session = provider.activeSession;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Báo Cáo Session'),
        actions: [
          ElevatedButton(
            onPressed: () async {
              await provider.finishWorkout();
              if (mounted) {
                Navigator.of(context).popUntil((route) => route.isFirst);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('🎉 Buổi tập đã đăng lên Bảng Tin Gym Chuột!'),
                    backgroundColor: GymChuotTheme.chalkOrange,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: GymChuotTheme.chalkOrange),
            child: const Text('Đăng Bảng Tin', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // PR Celebration Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF8A2E00), Color(0xFF26262B)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: GymChuotTheme.chalkOrange),
            ),
            child: const Row(
              children: [
                Text('🏆', style: TextStyle(fontSize: 36)),
                SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'KỶ LỤC CÁ NHÂN MỚI (PR)!',
                        style: TextStyle(color: GymChuotTheme.chalkOrange, fontWeight: FontWeight.w900, fontSize: 13),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Bench Press 120kg x 5 Reps',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
                      ),
                      Text(
                        'Ước tính 1RM: 138.5 kg (+4.2 kg so với tháng trước)',
                        style: TextStyle(fontSize: 12, color: GymChuotTheme.mutedSilver),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Session Analytics Matrix
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: GymChuotTheme.surfaceCard,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('THỐNG KÊ SESSION', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: GymChuotTheme.mutedSilver)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _MetricCard(
                      label: 'TỔNG TẢI TRỌNG',
                      value: '\${(session?.totalTonnageKg ?? 6800).toStringAsFixed(0)} kg',
                      icon: LucideIcons.dumbbell,
                      color: GymChuotTheme.chalkOrange,
                    ),
                    _MetricCard(
                      label: 'WORKING SETS',
                      value: '\${session?.totalCompletedSets ?? 14} Sets',
                      icon: LucideIcons.layers,
                      color: GymChuotTheme.electricCyan,
                    ),
                    const _MetricCard(
                      label: 'THỜI GIAN',
                      value: '52 Phút',
                      icon: LucideIcons.clock,
                      color: Colors.amber,
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Muscle Heatmap Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: GymChuotTheme.surfaceCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Bản đồ nhiệt cơ bắp',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 12),
                Center(
                  child: MuscleHeatmap(
                    width: 240,
                    height: 220,
                    setVolumeMap: session?.muscleVolumeMap ?? const {
                      MuscleGroup.chest: 7,
                      MuscleGroup.frontDelts: 4,
                      MuscleGroup.sideDelts: 3,
                      MuscleGroup.triceps: 5,
                      MuscleGroup.lats: 2,
                    },
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Telemetry Video Overlay Toggle
          SwitchListTile(
            value: _burnTelemetryOverlay,
            onChanged: (val) => setState(() => _burnTelemetryOverlay = val),
            activeColor: GymChuotTheme.electricCyan,
            tileColor: GymChuotTheme.surfaceCard,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            title: const Text('Ghi đè thông số lên video (Telemetry Overlay)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
            subtitle: const Text('Tự động gắn tạ, reps và RPE vào clip chia sẻ', style: TextStyle(fontSize: 11, color: GymChuotTheme.mutedSilver)),
          ),

          const SizedBox(height: 16),

          // Caption Field
          TextField(
            controller: _captionController,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: 'Cảm nghĩ buổi tập (Caption)',
              alignLabelWithHint: true,
              fillColor: GymChuotTheme.surfaceCard,
              filled: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _MetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 9, color: GymChuotTheme.mutedSilver, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
`,
  },
  {
    path: 'lib/screens/discover_screen.dart',
    name: 'discover_screen.dart',
    category: 'screens',
    description: 'Community Routines & Local Gym Venue Check-Ins',
    code: `import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';

class DiscoverScreen extends StatelessWidget {
  const DiscoverScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Khám Phá & Phòng Tập'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Local Gym Check-in Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E2836), Color(0xFF1A1A1E)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: GymChuotTheme.electricCyan.withOpacity(0.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(LucideIcons.mapPin, color: GymChuotTheme.electricCyan, size: 18),
                        SizedBox(width: 6),
                        Text('Phòng tập gần bạn', style: TextStyle(color: GymChuotTheme.electricCyan, fontWeight: FontWeight.bold, fontSize: 12)),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: GymChuotTheme.successGreen.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text('24 người đang tập', style: TextStyle(color: GymChuotTheme.successGreen, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text('California Fitness & Yoga Thanh Hóa', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                const Text('TTTM Vincom Plaza, 27 Trần Phú', style: TextStyle(fontSize: 11, color: GymChuotTheme.mutedSilver)),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('✅ Đã check-in tại phòng tập! Mọi người đã thấy bạn.')),
                    );
                  },
                  icon: const Icon(LucideIcons.checkCheck, size: 16),
                  label: const Text('Check-in tại phòng'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: GymChuotTheme.electricCyan,
                    foregroundColor: GymChuotTheme.ironBlack,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Community Routines Section
          const Text('LỊCH TẬP CỘNG ĐỒNG (FORKABLE)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: GymChuotTheme.mutedSilver)),
          const SizedBox(height: 10),

          _buildRoutineCard(
            context,
            title: 'Aura Powerbuilding Upper Hypertrophy',
            author: 'Long Aura',
            level: 'Cao Thủ',
            forks: 238,
            exercises: 'Bench Press, Incline DB, Bent Row, Cáp vai, Tay sau',
          ),
          const SizedBox(height: 10),
          _buildRoutineCard(
            context,
            title: 'Tân Binh Nhập Môn - Đi Tập Đê Full Body',
            author: 'Như Cute',
            level: 'Tân Binh',
            forks: 412,
            exercises: 'Goblet Squat, DB Press, Pulldown, Plank',
          ),
        ],
      ),
    );
  }

  Widget _buildRoutineCard(
    BuildContext context, {
    required String title,
    required String author,
    required String level,
    required int forks,
    required String exercises,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: GymChuotTheme.chalkOrange.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(level, style: const TextStyle(color: GymChuotTheme.chalkOrange, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text('Tác giả: $author • 🍴 $forks lượt sao chép', style: const TextStyle(fontSize: 11, color: GymChuotTheme.mutedSilver)),
            const SizedBox(height: 8),
            Text(exercises, style: const TextStyle(fontSize: 12, color: Color(0xFFD1D5DB))),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đã sao chép Routine vào thư viện cá nhân!')),
                );
              },
              icon: const Icon(LucideIcons.copy, size: 14),
              label: const Text('Lưu vào lịch tập của tôi', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/screens/challenges_screen.dart',
    name: 'challenges_screen.dart',
    category: 'screens',
    description: 'Monthly Volume Challenges & Gym Club Leaderboards',
    code: `import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';

class ChallengesScreen extends StatelessWidget {
  const ChallengesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thử Thách & CLB'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Active Challenge Hero Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF2A150A), Color(0xFF1E1E24)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: GymChuotTheme.chalkOrange.withOpacity(0.6)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Text('🏋️‍♂️', style: TextStyle(fontSize: 28)),
                    SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('THỬ THÁCH THÁNG NÀY', style: TextStyle(color: GymChuotTheme.chalkOrange, fontSize: 11, fontWeight: FontWeight.w900)),
                          Text('Thử Thách 100 Tấn Tháng Này', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text('Mục tiêu nâng tổng sản lượng 100,000 kg trong tháng. Còn 12 ngày.', style: TextStyle(fontSize: 12, color: GymChuotTheme.mutedSilver)),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: const LinearProgressIndicator(
                    value: 0.468,
                    minHeight: 8,
                    backgroundColor: Color(0xFF2A2A32),
                    valueColor: AlwaysStoppedAnimation(GymChuotTheme.chalkOrange),
                  ),
                ),
                const SizedBox(height: 6),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Tiến độ: 46.8 / 100 Tấn (46%)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    Text('1,420 thành viên tham gia', style: TextStyle(fontSize: 11, color: GymChuotTheme.mutedSilver)),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          const Text('BẢNG XẾP HẠNG CLB GYM', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: GymChuotTheme.mutedSilver)),
          const SizedBox(height: 10),

          _buildLeaderboardItem(1, 'California Fitness Thanh Hóa', '1,420,500 kg', true),
          _buildLeaderboardItem(2, 'Strongman Gym Hà Nội', '1,190,000 kg', false),
          _buildLeaderboardItem(3, 'The New Gym Hoàng Văn Thụ', '980,400 kg', false),
          _buildLeaderboardItem(4, 'Swequity Gym Cầu Giấy', '854,200 kg', false),
        ],
      ),
    );
  }

  Widget _buildLeaderboardItem(int rank, String gymName, String tonnage, bool isHomeGym) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isHomeGym ? GymChuotTheme.chalkOrange.withOpacity(0.1) : GymChuotTheme.surfaceCard,
        borderRadius: BorderRadius.circular(12),
        border: isHomeGym ? Border.all(color: GymChuotTheme.chalkOrange.withOpacity(0.4)) : null,
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: rank == 1 ? Colors.amber : GymChuotTheme.steelGray,
            child: Text(
              '$rank',
              style: TextStyle(
                color: rank == 1 ? GymChuotTheme.ironBlack : Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(gymName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                if (isHomeGym)
                  const Text('Phòng tập của bạn', style: TextStyle(color: GymChuotTheme.chalkOrange, fontSize: 10, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Text(tonnage, style: const TextStyle(fontWeight: FontWeight.w800, color: GymChuotTheme.electricCyan, fontSize: 13)),
        ],
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/screens/profile_screen.dart',
    name: 'profile_screen.dart',
    category: 'screens',
    description: 'Personal Profile with PR Trophy Case & 30-Day Heatmap Coverage',
    code: `import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('@long_powerbuilder'),
        actions: [
          IconButton(icon: const Icon(LucideIcons.qrCode), onPressed: () {}),
          IconButton(icon: const Icon(LucideIcons.settings), onPressed: () {}),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // User Card
          Row(
            children: [
              const CircleAvatar(
                radius: 36,
                backgroundColor: GymChuotTheme.chalkOrange,
                child: Text('LA', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Long Aura (PT Pro)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                    SizedBox(height: 2),
                    Text('📍 California Fitness Thanh Hóa', style: TextStyle(color: GymChuotTheme.mutedSilver, fontSize: 12)),
                    SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(LucideIcons.flame, color: GymChuotTheme.chalkOrange, size: 14),
                        SizedBox(width: 4),
                        Text('Chuỗi 6 Tuần Đều Đặn 🔥', style: TextStyle(color: GymChuotTheme.chalkOrange, fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // PR Trophy Case
          const Text('KỶ LỤC CÁ NHÂN (PR TROPHY CASE)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: GymChuotTheme.mutedSilver)),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildPRBox('BENCH PRESS', '140 kg', '1RM Est', GymChuotTheme.chalkOrange),
              const SizedBox(width: 8),
              _buildPRBox('SQUAT', '180 kg', '1RM Max', GymChuotTheme.electricCyan),
              const SizedBox(width: 8),
              _buildPRBox('DEADLIFT', '220 kg', '1RM Max', Colors.amber),
            ],
          ),

          const SizedBox(height: 24),

          // Monthly Consistency
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: GymChuotTheme.surfaceCard,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Mục Tiêu Tháng Này', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    Text('14 / 16 Buổi Tập', style: TextStyle(color: GymChuotTheme.successGreen, fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: const LinearProgressIndicator(
                    value: 14 / 16,
                    minHeight: 8,
                    backgroundColor: Color(0xFF2E2E36),
                    valueColor: AlwaysStoppedAnimation(GymChuotTheme.successGreen),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPRBox(String lift, String weight, String type, Color accentColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: GymChuotTheme.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: accentColor.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(lift, style: TextStyle(color: accentColor, fontSize: 10, fontWeight: FontWeight.w900)),
            const SizedBox(height: 4),
            Text(weight, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
            Text(type, style: const TextStyle(fontSize: 9, color: GymChuotTheme.mutedSilver)),
          ],
        ),
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/widgets/muscle_heatmap.dart',
    name: 'muscle_heatmap.dart',
    category: 'widgets',
    description: 'Dynamic Vector SVG Muscle Heatmap (flutter_svg + exercises.json) with 4-tier color interpolation',
    code: `import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_svg/flutter_svg.dart';
import '../models/exercise_model.dart';

class MuscleHeatmap extends StatelessWidget {
  final Map<MuscleGroup, int> setVolumeMap;
  final double height;
  final double width;

  const MuscleHeatmap({
    super.key,
    required this.setVolumeMap,
    this.height = 300,
    this.width = 220,
  });

  static String getColorHexForVolume(int sets) {
    if (sets <= 0) return '#334155'; // 0 Sets: Slate-700 / Inactive
    if (sets <= 3) return '#FBBF24'; // 1-3 Sets: Amber-400 / Light Activation
    if (sets <= 6) return '#FB923C'; // 4-6 Sets: Orange-400 / Moderate Fatigue
    return '#EF4444';                // 7+ Sets: Red-500 / High Fatigue
  }

  static Future<Map<MuscleGroup, int>> buildVolumeMapFromExercisesJson({
    required Map<String, int> completedSetsByExerciseName,
    String assetPath = 'assets/data/exercises.json',
  }) async {
    final rawJsonStr = await rootBundle.loadString(assetPath);
    final decoded = jsonDecode(rawJsonStr) as Map<String, dynamic>;
    final rawList = (decoded['exercises'] as List<dynamic>? ?? []);
    final Map<String, Map<String, dynamic>> catalogByName = {};
    for (final item in rawList) {
      if (item is Map<String, dynamic>) {
        final name = (item['name'] as String? ?? '').toLowerCase().trim();
        if (name.isNotEmpty) catalogByName[name] = item;
      }
    }

    final Map<MuscleGroup, double> accumulator = {};
    completedSetsByExerciseName.forEach((exerciseName, completedSets) {
      if (completedSets <= 0) return;
      final match = catalogByName[exerciseName.toLowerCase().trim()];
      if (match != null) {
        final primaries = (match['primaryMuscles'] as List<dynamic>? ?? []);
        final secondaries = (match['secondaryMuscles'] as List<dynamic>? ?? []);
        for (final p in primaries) {
          final group = MuscleGroup.fromJsonMuscleName(p.toString());
          accumulator[group] = (accumulator[group] ?? 0) + completedSets;
        }
        for (final s in secondaries) {
          final group = MuscleGroup.fromJsonMuscleName(s.toString());
          accumulator[group] = (accumulator[group] ?? 0) + (completedSets * 0.5);
        }
      }
    });

    return accumulator.map((key, value) => MapEntry(key, value.round()));
  }

  String _injectDynamicFills(String rawSvg) {
    String modifiedSvg = rawSvg;
    for (final muscle in MuscleGroup.values) {
      final volume = setVolumeMap[muscle] ?? 0;
      final hexColor = getColorHexForVolume(volume);
      final idPattern = 'id="\${muscle.name}"';
      if (modifiedSvg.contains(idPattern)) {
        modifiedSvg = modifiedSvg.replaceAll(
          RegExp('\$idPattern\\\\s+pathFill="[^"]*"(\\\\s+fill="[^"]*")?'),
          '\$idPattern fill="\$hexColor"',
        );
      }
    }
    return modifiedSvg;
  }

  @override
  Widget build(BuildContext context) {
    const String rawAnatomicalSvg = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 200" width="220" height="200">
  <g transform="translate(5, 0)">
    <path id="frontDelts" pathFill="default" fill="#334155" d="M29 38 Q23 40 21 49 Q27 50 31 41 Z M71 38 Q77 40 79 49 Q73 50 69 41 Z" />
    <path id="sideDelts" pathFill="default" fill="#334155" d="M21 43 Q17 48 18 55 Q22 54 23 46 Z M79 43 Q83 48 82 55 Q78 54 77 46 Z" />
    <path id="chest" pathFill="default" fill="#334155" d="M30 40 Q50 35 70 40 L68 58 Q50 62 32 58 Z" />
    <path id="biceps" pathFill="default" fill="#334155" d="M18 42 Q25 42 26 58 Q19 58 17 42 Z M74 42 Q81 42 83 58 Q75 58 74 42 Z" />
    <path id="abs" pathFill="default" fill="#334155" d="M34 62 Q50 64 66 62 L64 95 Q50 98 36 95 Z" />
    <path id="quads" pathFill="default" fill="#334155" d="M32 100 Q50 98 68 100 L64 145 Q50 148 36 145 Z" />
    <path id="calves" pathFill="default" fill="#334155" d="M35 149 Q33 164 37 182 L44 182 Q45 164 43 149 Z M65 149 Q67 164 63 182 L56 182 Q55 164 57 149 Z" />
  </g>
  <g transform="translate(115, 0)">
    <path id="upperBack" pathFill="default" fill="#334155" d="M36 36 L64 36 L68 45 L50 55 L32 45 Z" />
    <path id="rearDelts" pathFill="default" fill="#334155" d="M24 38 Q20 43 22 49 Q28 48 31 41 Z M76 38 Q80 43 78 49 Q72 48 69 41 Z" />
    <path id="lats" pathFill="default" fill="#334155" d="M32 46 L48 56 L45 78 Q33 70 32 46 Z M68 46 L52 56 L55 78 Q67 70 68 46 Z" />
    <path id="lowerBack" pathFill="default" fill="#334155" d="M39 68 L61 68 L59 83 L41 83 Z" />
    <path id="triceps" pathFill="default" fill="#334155" d="M19 46 Q25 46 26 63 Q19 63 18 46 Z M74 46 Q81 46 82 63 Q75 63 74 46 Z" />
    <path id="glutes" pathFill="default" fill="#334155" d="M34 84 Q50 81 66 84 L66 101 Q50 105 34 101 Z" />
    <path id="hamstrings" pathFill="default" fill="#334155" d="M34 104 Q50 102 66 104 L63 145 Q50 148 37 145 Z" />
  </g>
</svg>
''';

    return SvgPicture.string(
      _injectDynamicFills(rawAnatomicalSvg),
      height: height,
      width: width,
      fit: BoxFit.contain,
    );
  }
}
`,
  },
  {
    path: 'lib/widgets/plate_calculator_dialog.dart',
    name: 'plate_calculator_dialog.dart',
    category: 'widgets',
    description: 'Olympic Barbell Plate Calculator (20kg bar + 20, 15, 10, 5, 2.5, 1.25kg plates)',
    code: `import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class PlateCalculatorDialog extends StatefulWidget {
  final double initialTargetKg;
  const PlateCalculatorDialog({super.key, this.initialTargetKg = 100});

  @override
  State<PlateCalculatorDialog> createState() => _PlateCalculatorDialogState();
}

class _PlateCalculatorDialogState extends State<PlateCalculatorDialog> {
  late double _targetKg;
  final double _barWeightKg = 20.0;
  final List<double> _availablePlates = [20.0, 15.0, 10.0, 5.0, 2.5, 1.25];

  @override
  void initState() {
    super.initState();
    _targetKg = widget.initialTargetKg;
  }

  Map<double, int> _calculatePlatesPerSide() {
    double remainingPerSide = (_targetKg - _barWeightKg) / 2.0;
    if (remainingPerSide < 0) remainingPerSide = 0;

    final Map<double, int> platesCount = {};
    for (final plate in _availablePlates) {
      final count = (remainingPerSide / plate).floor();
      if (count > 0) {
        platesCount[plate] = count;
        remainingPerSide -= count * plate;
      }
    }
    return platesCount;
  }

  @override
  Widget build(BuildContext context) {
    final plates = _calculatePlatesPerSide();

    return AlertDialog(
      backgroundColor: GymChuotTheme.steelGray,
      title: const Text('Tính Bánh Tạ (Plate Calculator)', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '\${_targetKg.toStringAsFixed(1)} kg',
            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: GymChuotTheme.chalkOrange),
          ),
          const Text('Đòn tiêu chuẩn 20kg', style: TextStyle(fontSize: 11, color: GymChuotTheme.mutedSilver)),
          const SizedBox(height: 16),
          const Text('Mỗi bên cần lắp:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: plates.entries.map((entry) {
              return Chip(
                backgroundColor: GymChuotTheme.ironBlack,
                side: const BorderSide(color: GymChuotTheme.electricCyan),
                label: Text(
                  '\${entry.value} × \${entry.key}kg',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: GymChuotTheme.electricCyan),
                ),
              );
            }).toList(),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Đóng', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
`,
  },
  {
    path: 'lib/widgets/rest_timer_sheet.dart',
    name: 'rest_timer_sheet.dart',
    category: 'widgets',
    description: 'Sticky countdown Rest Timer with +30s and Skip controls',
    code: `import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';

class RestTimerSheet extends StatelessWidget {
  final int secondsRemaining;
  final VoidCallback onAdd30s;
  final VoidCallback onSkip;

  const RestTimerSheet({
    super.key,
    required this.secondsRemaining,
    required this.onAdd30s,
    required this.onSkip,
  });

  String _formatTime(int s) {
    final m = (s ~/ 60).toString().padLeft(2, '0');
    final sec = (s % 60).toString().padLeft(2, '0');
    return '$m:$sec';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: Color(0xFF1E1E24),
        border: Border(top: BorderSide(color: GymChuotTheme.electricCyan, width: 2)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.timer, color: GymChuotTheme.electricCyan, size: 20),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('NGHỈ GIỮA SET', style: TextStyle(fontSize: 10, color: GymChuotTheme.mutedSilver, fontWeight: FontWeight.bold)),
              Text(
                _formatTime(secondsRemaining),
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: GymChuotTheme.electricCyan),
              ),
            ],
          ),
          const Spacer(),
          TextButton(
            onPressed: onAdd30s,
            child: const Text('+30s', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: onSkip,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF33333D),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            child: const Text('Bỏ qua', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/widgets/dap_button.dart',
    name: 'dap_button.dart',
    category: 'widgets',
    description: 'Animated Flexed Bicep "Daps" button with instant tactile feedback',
    code: `import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class DapButton extends StatefulWidget {
  final int initialCount;
  const DapButton({super.key, this.initialCount = 0});

  @override
  State<DapButton> createState() => _DapButtonState();
}

class _DapButtonState extends State<DapButton> with SingleTickerProviderStateMixin {
  late int _count;
  bool _isDapped = false;
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _count = widget.initialCount;
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.4), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.4, end: 1.0), weight: 50),
    ]).animate(_animController);
  }

  void _handleDap() {
    setState(() {
      _isDapped = !_isDapped;
      _count += _isDapped ? 1 : -1;
    });
    if (_isDapped) {
      _animController.forward(from: 0.0);
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: _handleDap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: _isDapped ? GymChuotTheme.chalkOrange.withOpacity(0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: _isDapped ? GymChuotTheme.chalkOrange : const Color(0xFF383842),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ScaleTransition(
              scale: _scaleAnimation,
              child: const Text('💪', style: TextStyle(fontSize: 16)),
            ),
            const SizedBox(width: 6),
            Text(
              '$_count Daps',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: _isDapped ? GymChuotTheme.chalkOrange : GymChuotTheme.pureWhite,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }
}
`,
  },
  {
    path: 'lib/widgets/nudge_modal.dart',
    name: 'nudge_modal.dart',
    category: 'widgets',
    description: 'Nudge Modal with energetic Vietnamese presets: "Đi tập đê!"',
    code: `import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class NudgeModal extends StatelessWidget {
  final String buddyName;
  const NudgeModal({super.key, required this.buddyName});

  @override
  Widget build(BuildContext context) {
    final presets = [
      'Dậy đi tập đê anh ơi! 💪',
      'Hôm nay chân mà trốn à? 🦵',
      'Qua phòng đi em bao nước!',
      'Gần hết chuỗi rồi, đi tập đê! 🔥',
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: GymChuotTheme.steelGray,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('🔔', style: TextStyle(fontSize: 24)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Hú $buddyName "Đi tập đê!"',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text('Chọn lời nhắn nhanh tiếp lửa cho bạn tập:', style: TextStyle(fontSize: 12, color: GymChuotTheme.mutedSilver)),
          const SizedBox(height: 12),
          ...presets.map((msg) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('⚡ Đã gửi nudge "$msg" tới $buddyName!'),
                        backgroundColor: GymChuotTheme.chalkOrange,
                      ),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    alignment: Alignment.centerLeft,
                    side: const BorderSide(color: Color(0xFF383842)),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                  child: Text(msg, style: const TextStyle(color: Colors.white, fontSize: 13)),
                ),
              )),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/main.dart',
    name: 'main.dart',
    category: 'main',
    description: 'Flutter Application Entry Point with Provider & Dark Theme initialization',
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme/app_theme.dart';
import 'providers/workout_provider.dart';
import 'screens/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Khởi tạo Firebase:
  // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => WorkoutProvider()),
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
      title: 'Gym Chuột - Đi tập đê!',
      debugShowCheckedModeBanner: false,
      theme: GymChuotTheme.darkTheme,
      home: const MainNavigationScreen(),
    );
  }
}
`,
  },
  {
    path: 'lib/services/flex_story_service.dart',
    name: 'flex_story_service.dart',
    category: 'services',
    description: 'High-res 1080x1920 PNG RepaintBoundary capture & native OS share sheet service (share_plus + path_provider)',
    code: `// lib/services/flex_story_service.dart

import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

class FlexStoryService {
  /// Captures the RepaintBoundary widget as a 1080x1920 HD PNG image and opens native share sheet
  static Future<bool> captureAndShareStory(GlobalKey boundaryKey) async {
    try {
      // 1. Find the RenderRepaintBoundary from the widget key
      final boundary = boundaryKey.currentContext?.findRenderObject()
          as RenderRepaintBoundary?;

      if (boundary == null) return false;

      // 2. Render pixel raster at 3.0x pixel ratio for high-res story output
      final ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);

      if (byteData == null) return false;

      final pngBytes = byteData.buffer.asUint8List();

      // 3. Write image file to device temporary directory
      final tempDir = await getTemporaryDirectory();
      final filePath =
          '\${tempDir.path}/di_tap_de_story_\${DateTime.now().millisecondsSinceEpoch}.png';
      final file = File(filePath);
      await file.writeAsBytes(pngBytes);

      // 4. Launch native system share tray (Instagram / TikTok / Facebook Stories)
      final xFile = XFile(filePath);
      final result = await Share.shareXFiles(
        [xFile],
        text: 'Vừa hoàn thành buổi tập cùng Đi tập đê! Đi tập đê! 🔥 #DiTapDe',
      );

      return result.status == ShareResultStatus.success;
    } catch (e) {
      debugPrint('Error exporting Flex Story card: \$e');
      return false;
    }
  }
}
`,
  },
  {
    path: 'lib/widgets/flex_story_card.dart',
    name: 'flex_story_card.dart',
    category: 'widgets',
    description: '9:16 Portrait Story Card Canvas with Strava-Style Telemetry Card & "Đi tập đê!" Branding Overlay',
    code: `// lib/widgets/flex_story_card.dart

import 'dart:io';
import 'package:flutter/material.dart';

class FlexStoryCard extends StatelessWidget {
  final String userName;
  final String userHandle;
  final String gymLocation;
  final String workoutTitle;
  final int totalVolumeKg;
  final int totalSets;
  final String durationFormatted;
  final String prBadgeText;
  final Map<String, int> muscleSetCounts;
  final String selectedTagline;
  final File? backgroundMediaFile;

  const FlexStoryCard({
    super.key,
    required this.userName,
    required this.userHandle,
    required this.gymLocation,
    required this.workoutTitle,
    required this.totalVolumeKg,
    required this.totalSets,
    required this.durationFormatted,
    required this.prBadgeText,
    required this.muscleSetCounts,
    required this.selectedTagline,
    this.backgroundMediaFile,
  });

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 9 / 16,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF121212),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: const Color(0xFFFF5722).withOpacity(0.5),
              width: 2,
            ),
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // 1. Full-Bleed Background Media with Contrast Scrims
              _buildBackgroundMediaLayer(),

              // 2. Strava-Style Telemetry & "Đi tập đê!" Branding Overlay
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Top Bar: Prominent "Đi tập đê!" Branding + Gym Badge
                    _buildBrandedHeader(),

                    const Spacer(),

                    // Middle Section: Notable PR Badge + Title
                    if (prBadgeText.isNotEmpty) _buildPrFloatingBadge(),

                    Text(
                      workoutTitle,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        height: 1.15,
                        shadows: [
                          Shadow(
                            color: Colors.black,
                            offset: Offset(0, 2),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),

                    // Custom Quote / Tagline
                    Text(
                      '“\$selectedTagline”',
                      style: const TextStyle(
                        color: Color(0xFFFF5722),
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        fontStyle: FontStyle.italic,
                        shadows: [
                          Shadow(
                            color: Colors.black,
                            offset: Offset(0, 1),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Bottom Bar: Floating Translucent Telemetry Card
                    _buildTelemetryCard(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBackgroundMediaLayer() {
    if (backgroundMediaFile == null) {
      return Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1E1E1E), Color(0xFF121212), Color(0xFF0A0A0A)],
          ),
        ),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        Image.file(
          backgroundMediaFile!,
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
        ),
        Container(color: Colors.black.withOpacity(0.35)),
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.80),
                Colors.transparent,
                Colors.black.withOpacity(0.90),
              ],
              stops: const [0.0, 0.40, 1.0],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBrandedHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFF25438), Color(0xFFFF5722)],
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFFF5722).withOpacity(0.4),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.fitness_center_rounded,
                color: Color(0xFF121212),
                size: 24,
              ),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ĐI TẬP ĐÊ!',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
                Text(
                  'COMMUNITY WORKOUT LOG',
                  style: TextStyle(
                    color: Color(0xFFFF5722),
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
              ],
            ),
          ],
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.60),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white24),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.location_on_rounded,
                color: Color(0xFFFF5722),
                size: 12,
              ),
              const SizedBox(width: 4),
              Text(
                gymLocation,
                style: const TextStyle(
                  color: Colors.white87,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPrFloatingBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFF5722),
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF5722).withOpacity(0.5),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('⚡ ', style: TextStyle(fontSize: 14)),
          Text(
            prBadgeText.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  String _formatVolume(int volume) {
    final digits = volume.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && (digits.length - i) % 3 == 0) {
        buffer.write(',');
      }
      buffer.write(digits[i]);
    }
    return buffer.toString();
  }

  Widget _buildTelemetryCard() {
    final int resolvedTotalSets = totalSets > 0
        ? totalSets
        : muscleSetCounts.values.fold<int>(0, (sum, count) => sum + count);
    final int resolvedVolumeKg = totalVolumeKg >= 0 ? totalVolumeKg : 0;
    final activeMuscles = muscleSetCounts.entries
        .where((entry) => entry.value > 0)
        .map((entry) => '\${entry.key} (\${entry.value})')
        .toList();
    final muscleSummaryText = activeMuscles.isNotEmpty
        ? activeMuscles.join(' • ')
        : muscleSetCounts.keys.join(' • ');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.60),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStravaMetric(
                'KHỐI LƯỢNG',
                _formatVolume(resolvedVolumeKg),
                'KG',
              ),
              _buildDivider(),
              _buildStravaMetric('THỜI GIAN', durationFormatted, ''),
              _buildDivider(),
              _buildStravaMetric('SỐ SET', '\$resolvedTotalSets', 'SETS'),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: Colors.white12, height: 1),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(
                      Icons.fitness_center_rounded,
                      color: Color(0xFFFF5722),
                      size: 14,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        muscleSummaryText,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white87,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '@\$userHandle',
                style: const TextStyle(color: Colors.white54, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStravaMetric(String label, String value, String unit) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 8,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 2),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            if (unit.isNotEmpty) ...[
              const SizedBox(width: 2),
              Text(
                unit,
                style: const TextStyle(
                  color: Color(0xFFFF5722),
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(height: 24, width: 1, color: Colors.white12);
  }
}
`,
  },
  {
    path: 'lib/widgets/flex_story_modal.dart',
    name: 'flex_story_modal.dart',
    category: 'widgets',
    description: 'Interactive Story Preview & Customization Modal with Vietnamese Flex Taglines & RepaintBoundary Export',
    code: `// lib/widgets/flex_story_modal.dart

import 'dart:io';
import 'package:flutter/material.dart';
import '../services/flex_story_service.dart';
import 'flex_story_card.dart';

class FlexStoryModal extends StatefulWidget {
  final String workoutTitle;
  final int totalVolumeKg;
  final int totalSets;
  final String durationFormatted;
  final String prBadgeText;
  final Map<String, int> muscleSetCounts;
  final File? backgroundMediaFile;

  const FlexStoryModal({
    super.key,
    required this.workoutTitle,
    required this.totalVolumeKg,
    required this.totalSets,
    required this.durationFormatted,
    required this.prBadgeText,
    required this.muscleSetCounts,
    this.backgroundMediaFile,
  });

  @override
  State<FlexStoryModal> createState() => _FlexStoryModalState();
}

class _FlexStoryModalState extends State<FlexStoryModal> {
  final GlobalKey _boundaryKey = GlobalKey();
  bool _isExporting = false;

  final List<String> _presetTaglines = [
    'Tập xong không hỏng giò - Không về! 🦵',
    'Đói tạ hơn đái dầm! 🔥',
    'Mệt nhưng mà nó sướng! 💪',
    'Nói ít thôi, nâng tạ đi! 🤐',
    'Thà đau cơ còn hơn đau lòng! ❤️🩹',
  ];

  late String _selectedTagline;
  final TextEditingController _customTaglineController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _selectedTagline = _presetTaglines[0];
  }

  void _exportStory() async {
    setState(() => _isExporting = true);
    bool success = await FlexStoryService.captureAndShareStory(_boundaryKey);
    if (mounted) {
      setState(() => _isExporting = false);
      if (success) {
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Lỗi khi tạo Story. Vui lòng thử lại!'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white10),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Xuất Story Flex 🔥',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              RepaintBoundary(
                key: _boundaryKey,
                child: FlexStoryCard(
                  userName: 'Tùng Nguyễn',
                  userHandle: 'tung_powerbuilder',
                  gymLocation: '📍 Strongman Gym',
                  workoutTitle: widget.workoutTitle,
                  totalVolumeKg: widget.totalVolumeKg,
                  totalSets: widget.totalSets,
                  durationFormatted: widget.durationFormatted,
                  prBadgeText: widget.prBadgeText,
                  muscleSetCounts: widget.muscleSetCounts,
                  selectedTagline: _selectedTagline,
                  backgroundMediaFile: widget.backgroundMediaFile,
                ),
              ),
              const SizedBox(height: 16),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('CHỌN QUOTE FLEX:', style: TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 38,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _presetTaglines.length,
                  itemBuilder: (ctx, idx) {
                    final tag = _presetTaglines[idx];
                    final isSelected = tag == _selectedTagline;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(tag),
                        selected: isSelected,
                        selectedColor: const Color(0xFFFF5722),
                        backgroundColor: const Color(0xFF2C2C2C),
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : Colors.white70,
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                        onSelected: (_) {
                          setState(() => _selectedTagline = tag);
                        },
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _customTaglineController,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Hoặc tự điền quote riêng của bạn...',
                  hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
                  filled: true,
                  fillColor: const Color(0xFF121212),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.check_circle, color: Color(0xFFFF5722)),
                    onPressed: () {
                      if (_customTaglineController.text.trim().isNotEmpty) {
                        setState(() => _selectedTagline = _customTaglineController.text.trim());
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF5722),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _isExporting ? null : _exportStory,
                  icon: _isExporting
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.share_rounded, color: Colors.white),
                  label: Text(
                    _isExporting ? 'Đang Tạo Story...' : 'Chia Sẻ Lên Story',
                    style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/services/auth_service.dart',
    name: 'auth_service.dart',
    category: 'services',
    description: 'Firebase Authentication Service supporting Anonymous Session, Google Sign-In, Apple Sign-In & Safe Credential Linking',
    code: `// lib/services/auth_service.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Stream of Auth State changes
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Current Firebase User
  User? get currentUser => _auth.currentUser;

  /// Start or reuse an Anonymous Session for offline/quick testing
  Future<UserCredential?> signInAnonymously() async {
    try {
      if (_auth.currentUser != null) {
        return null;
      }
      final credential = await _auth.signInAnonymously();
      if (credential.user != null) {
        await _syncUserDocument(credential.user!);
      }
      return credential;
    } catch (e) {
      debugPrint('Error signing in anonymously: \$e');
      rethrow;
    }
  }

  /// Sign in or Link account using Google Sign-In
  Future<UserCredential?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null; // User canceled login flow

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final OAuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await _linkOrSignInWithCredential(credential);
      if (userCredential.user != null) {
        await _syncUserDocument(userCredential.user!);
      }
      return userCredential;
    } catch (e) {
      debugPrint('Error signing in with Google: \$e');
      rethrow;
    }
  }

  /// Sign in or Link account using Apple Sign-In
  Future<UserCredential?> signInWithApple() async {
    try {
      final AppleIDCredential appleCredential =
          await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final OAuthCredential credential =
          OAuthProvider('apple.com').credential(
        idToken: appleCredential.identityToken,
        accessToken: appleCredential.authorizationCode,
      );

      final userCredential = await _linkOrSignInWithCredential(credential);

      final givenName = appleCredential.givenName ?? '';
      final familyName = appleCredential.familyName ?? '';
      final fullName = '\$familyName \$givenName'.trim();
      if (fullName.isNotEmpty && userCredential.user != null) {
        await userCredential.user!.updateDisplayName(fullName);
      }

      if (userCredential.user != null) {
        await _syncUserDocument(
          userCredential.user!,
          fallbackName: fullName.isNotEmpty ? fullName : null,
        );
      }

      return userCredential;
    } catch (e) {
      debugPrint('Error signing in with Apple: \$e');
      rethrow;
    }
  }

  /// Xử lý an toàn khi liên kết tài khoản ẩn danh với Google/Apple:
  /// Loại bỏ thao tác currentUser.delete() để bảo vệ dữ liệu người dùng khi gặp xung đột tài khoản
  Future<UserCredential> _linkOrSignInWithCredential(
    AuthCredential credential,
  ) async {
    final currentUser = _auth.currentUser;

    if (currentUser != null && currentUser.isAnonymous) {
      try {
        // Liên kết tài khoản khách với Google/Apple
        return await currentUser.linkWithCredential(credential);
      } on FirebaseAuthException catch (e) {
        if (e.code == 'credential-already-in-use') {
          // KHÔNG xóa tài khoản ẩn danh cũ ngay lập tức để tránh mất dữ liệu chưa đồng bộ
          // Tiến hành đăng nhập vào tài khoản đã tồn tại
          return await _auth.signInWithCredential(credential);
        }
        rethrow;
      }
    } else {
      return await _auth.signInWithCredential(credential);
    }
  }

  /// Đồng bộ thông tin hồ sơ người dùng lên \`/users/{userId}\` theo chuẩn schema bảo mật
  Future<void> _syncUserDocument(User user, {String? fallbackName}) async {
    try {
      final rawName = user.displayName?.trim().isNotEmpty == true
          ? user.displayName!.trim()
          : (fallbackName ??
              (user.isAnonymous ? 'Gymer Khách' : 'Gymer Đi Tập Đê'));
      final safeDisplayName = rawName.length > 50
          ? rawName.substring(0, 50)
          : (rawName.length < 2 ? 'Gymer' : rawName);

      await _db.collection('users').doc(user.uid).set(
        {
          'displayName': safeDisplayName,
          'updatedAt': FieldValue.serverTimestamp(),
        },
        SetOptions(merge: true),
      );
    } catch (e) {
      debugPrint('Error syncing user document: \$e');
    }
  }

  /// Sign out from Firebase Auth and Google Sign-In
  Future<void> signOut() async {
    try {
      await Future.wait([
        _auth.signOut(),
        _googleSignIn.signOut(),
      ]);
    } catch (e) {
      debugPrint('Error signing out: \$e');
      rethrow;
    }
  }
}
`,
  },
  {
    path: 'lib/services/nudge_service.dart',
    name: 'nudge_service.dart',
    category: 'services',
    description: 'FCM Push Notification & Cloud Function (sendNudgeNotification) Nudge Service',
    code: `// lib/services/nudge_service.dart

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

class NudgeService {
  static final NudgeService _instance = NudgeService._internal();
  factory NudgeService() => _instance;
  NudgeService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  /// Initialize FCM permissions and store token on user document
  Future<void> init(String currentUserId) async {
    final NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      final String? token = await _fcm.getToken();
      if (token != null) {
        await _db.collection('users').doc(currentUserId).set(
          {
            'fcmToken': token,
            'updatedAt': FieldValue.serverTimestamp(),
          },
          SetOptions(merge: true),
        );
      }
    }
  }

  /// Triggers a real-time "Đi tập đê!" FCM push notification to target friend
  /// via the secure \`sendNudgeNotification\` Cloud Function gateway.
  Future<bool> sendDitapdeNudge({
    required String senderId,
    required String senderName,
    required String targetUserId,
    String? customMessage,
  }) async {
    try {
      final HttpsCallable callable =
          _functions.httpsCallable('sendNudgeNotification');
      final HttpsCallableResult<dynamic> result = await callable.call({
        'targetUserId': targetUserId,
        'nudgeType': 'workout_nudge',
      });

      final responseData = result.data;
      return responseData is Map && responseData['success'] == true;
    } catch (e) {
      debugPrint('Error sending nudge: \$e');
      return false;
    }
  }
}
`,
  },
  {
    path: 'functions/index.js',
    name: 'index.js',
    category: 'services',
    description: 'Hardened Cloud Function (sendNudgeNotification) with App Check & 30s Rate Limit',
    code: `const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendNudgeNotification = functions
  .runWith({
    maxInstances: 10, // Giới hạn instance tối đa để phòng chống tấn công DoS / Bùng nổ chi phí
    timeoutSeconds: 10,
  })
  .https.onCall(async (data, context) => {
    // 1. Kiểm tra Firebase App Check (Đảm bảo request đến từ ứng dụng Flutter hợp lệ)
    if (process.env.NODE_ENV === "production" && !context.app) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Yêu cầu bị từ chối do không qua được xác thực Firebase App Check."
      );
    }

    // 2. Kiểm tra Authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Bạn cần đăng nhập để gửi lời nhắc Đi tập đê!"
      );
    }

    const { targetUserId, nudgeType } = data;
    const senderId = context.auth.uid;

    if (!targetUserId || typeof targetUserId !== "string" || targetUserId === senderId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Mục tiêu nhận thông báo không hợp lệ."
      );
    }

    const db = admin.firestore();

    // 3. Rate Limit trên Cloud Function (Tối đa 1 nudge / 30 giây giữa cùng 1 cặp người dùng)
    const recentNudgeQuery = await db
      .collection("nudges_log")
      .where("senderId", "==", senderId)
      .where("targetUserId", "==", targetUserId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!recentNudgeQuery.empty) {
      const lastNudge = recentNudgeQuery.docs[0].data();
      const timeDiff = (Date.now() - lastNudge.createdAt.toMillis()) / 1000;
      if (timeDiff < 30) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          \`Vui lòng đợi \${Math.ceil(30 - timeDiff)} giây trước khi nhắc tiếp!\`
        );
      }
    }

    // 4. Lấy thông tin & Gửi FCM
    const targetDoc = await db.collection("users").doc(targetUserId).get();
    if (!targetDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Không tìm thấy người dùng.");
    }

    const fcmToken = targetDoc.data()?.fcmToken;
    if (!fcmToken) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Người dùng chưa bật nhận thông báo push."
      );
    }

    const senderDoc = await db.collection("users").doc(senderId).get();
    const senderName = senderDoc.data()?.displayName || "Cạ tập";

    const message = {
      token: fcmToken,
      notification: {
        title: "Đi tập đê! 🔥",
        body: \`\${senderName} vừa nhắc: "Đến giờ nâng tạ rồi, đi tập đê!" 💪\`,
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        senderId: senderId,
        type: nudgeType || "workout_nudge",
      },
    };

    const response = await admin.messaging().send(message);

    // Ghi log để phục vụ rate limit
    await db.collection("nudges_log").add({
      senderId,
      targetUserId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, messageId: response };
  });
`,
  },
  {
    path: 'firestore.rules',
    name: 'firestore.rules',
    category: 'config',
    description: 'Hardened Firestore Security Rules with Rate Limit (lastWorkoutAt) & Strict Field Allowlist (hasOnly)',
    code: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Rate Limit chính xác bằng cách đọc trường lastWorkoutAt từ document cá nhân của User
    function isNotRateLimited(userId) {
      let userDoc = get(/databases/\$(database)/documents/users/\$(userId));
      return userDoc == null 
        || !('lastWorkoutAt' in userDoc.data) 
        || request.time > userDoc.data.lastWorkoutAt + duration.value(30, 's');
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, update: if isOwner(userId)
        && request.resource.data.keys().hasOnly(['displayName', 'fcmToken', 'lastWorkoutAt', 'updatedAt'])
        && request.resource.data.displayName is string
        && request.resource.data.displayName.size() >= 2
        && request.resource.data.displayName.size() <= 50;
      allow delete: if false;
    }

    match /workouts/{workoutId} {
      allow read: if isAuthenticated();
      
      allow create: if isAuthenticated()
        && request.resource.data.userId == request.auth.uid
        && isNotRateLimited(request.auth.uid)
        // Bắt buộc xác thực chính xác Schema - Không cho phép chèn field lạ (Field Injection)
        && request.resource.data.keys().hasOnly(['userId', 'workoutTitle', 'totalVolumeKg', 'totalSets', 'createdAt'])
        && request.resource.data.workoutTitle is string
        && request.resource.data.workoutTitle.size() >= 3
        && request.resource.data.workoutTitle.size() <= 100
        && request.resource.data.totalVolumeKg is number
        && request.resource.data.totalVolumeKg >= 0
        && request.resource.data.totalSets is int
        && request.resource.data.totalSets > 0
        && request.resource.data.totalSets <= 200
        && request.resource.data.createdAt == request.time;

      allow update, delete: if isOwner(resource.data.userId);
    }

    match /nudges_log/{logId} {
      allow read: if isAuthenticated() && (resource.data.senderId == request.auth.uid || resource.data.targetUserId == request.auth.uid);
      allow write: if false; // Chỉ Cloud Functions mới được ghi
    }
  }
}
`,
  },
];
