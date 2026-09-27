// lib/services/database_service.dart

import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'routine_fork_service.dart';

enum FirestoreOperationType {
  create,
  update,
  delete,
  list,
  get,
  write,
}

/// User profile model synced with `/users/{userId}`
class UserProfileModel {
  final String id;
  final String email;
  final String name;
  final String handle;
  final String avatar;
  final String gymVenue;
  final int streakWeeks;
  final String bio;
  final String? fcmToken;
  final DateTime? createdAt;

  const UserProfileModel({
    required this.id,
    required this.email,
    required this.name,
    required this.handle,
    required this.avatar,
    required this.gymVenue,
    required this.streakWeeks,
    this.bio = '',
    this.fcmToken,
    this.createdAt,
  });

  Map<String, dynamic> toFirestore() => {
        'id': id,
        'email': email,
        'name': name,
        'handle': handle,
        'avatar': avatar,
        'gymVenue': gymVenue,
        'streakWeeks': streakWeeks,
        'bio': bio,
        if (fcmToken != null) 'fcmToken': fcmToken,
        'createdAt': (createdAt ?? DateTime.now()).toIso8601String(),
      };

  factory UserProfileModel.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final data = doc.data() ?? <String, dynamic>{};
    return UserProfileModel(
      id: (data['id'] as String?) ?? doc.id,
      email: (data['email'] as String?) ?? '',
      name: (data['name'] as String?) ?? 'Gymer',
      handle: (data['handle'] as String?) ?? '@gymer',
      avatar: (data['avatar'] as String?) ?? '',
      gymVenue:
          (data['gymVenue'] as String?) ?? 'California Fitness & Yoga Thanh Hóa',
      streakWeeks: (data['streakWeeks'] as num?)?.toInt() ?? 0,
      bio: (data['bio'] as String?) ?? '',
      fcmToken: data['fcmToken'] as String?,
      createdAt: _parseDateTime(data['createdAt']),
    );
  }
}

/// Gym buddy model synced from `/users`
class GymBuddyModel {
  final String id;
  final String name;
  final String handle;
  final String avatar;
  final String gymVenue;
  final int streakWeeks;
  final bool isOnline;
  final String statusText;

  const GymBuddyModel({
    required this.id,
    required this.name,
    required this.handle,
    required this.avatar,
    required this.gymVenue,
    required this.streakWeeks,
    required this.isOnline,
    required this.statusText,
  });

  factory GymBuddyModel.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final data = doc.data() ?? <String, dynamic>{};
    final status = (data['status'] as String?) ?? 'resting';
    final streak = (data['streakWeeks'] as num?)?.toInt() ?? 1;
    return GymBuddyModel(
      id: (data['id'] as String?) ?? doc.id,
      name: (data['name'] as String?) ?? 'Gymer',
      handle: (data['handle'] as String?) ?? '@gymer',
      avatar: (data['avatar'] as String?) ?? '',
      gymVenue: (data['gymVenue'] as String?) ?? 'Strongman Gym',
      streakWeeks: streak,
      isOnline: status == 'online_gym' || (data['isOnline'] as bool? ?? false),
      statusText: status == 'online_gym' ? 'Đang tập' : 'Chuỗi ${streak}T',
    );
  }
}

/// Comment model for feed posts
class PostCommentModel {
  final String id;
  final String userId;
  final String userName;
  final String userAvatar;
  final String text;
  final String timestamp;

  const PostCommentModel({
    required this.id,
    required this.userId,
    required this.userName,
    required this.userAvatar,
    required this.text,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'userId': userId,
        'userName': userName,
        'userAvatar': userAvatar,
        'text': text,
        'timestamp': timestamp,
      };

  factory PostCommentModel.fromMap(Map<String, dynamic> map) {
    return PostCommentModel(
      id: (map['id'] as String?) ?? '',
      userId: (map['userId'] as String?) ?? '',
      userName: (map['userName'] as String?) ?? 'Gymer',
      userAvatar: (map['userAvatar'] as String?) ?? '',
      text: (map['text'] as String?) ?? '',
      timestamp: (map['timestamp'] as String?) ?? 'Vừa xong',
    );
  }
}

/// Feed post model synced with `/feed_posts/{postId}` and `/posts/{postId}`
class FeedPostModel {
  final String id;
  final String userId;
  final String userName;
  final String userAvatar;
  final String userGym;
  final String? userBadge;
  final String title;
  final String caption;
  final int totalTonnageKg;
  final int durationMinutes;
  final int totalSets;
  final int dapsCount;
  final List<String> dappedBy;
  final int commentsCount;
  final List<PostCommentModel> comments;
  final int forkCount;
  final String? prHighlight;
  final String timestamp;
  final Map<String, int> muscleVolumeMap;
  final RoutineModel routineData;
  final DateTime? createdAt;

  const FeedPostModel({
    required this.id,
    required this.userId,
    required this.userName,
    required this.userAvatar,
    required this.userGym,
    this.userBadge,
    required this.title,
    required this.caption,
    required this.totalTonnageKg,
    required this.durationMinutes,
    required this.totalSets,
    this.dapsCount = 0,
    this.dappedBy = const [],
    this.commentsCount = 0,
    this.comments = const [],
    this.forkCount = 0,
    this.prHighlight,
    required this.timestamp,
    this.muscleVolumeMap = const {},
    required this.routineData,
    this.createdAt,
  });

  Map<String, dynamic> toFirestore() => {
        'id': id,
        'userId': userId,
        'userName': userName,
        'userAvatar': userAvatar,
        'userGym': userGym,
        if (userBadge != null) 'userBadge': userBadge,
        'title': title,
        'caption': caption,
        'totalTonnageKg': totalTonnageKg,
        'durationMinutes': durationMinutes,
        'totalSets': totalSets,
        'dapsCount': dapsCount,
        'dappedBy': dappedBy,
        'commentsCount': commentsCount,
        'comments': comments.map((c) => c.toMap()).toList(),
        'forkCount': forkCount,
        if (prHighlight != null) 'prHighlight': prHighlight,
        'timestamp': timestamp,
        'muscleVolumeMap': muscleVolumeMap,
        'routineData': routineData.toJson(),
        'createdAt': (createdAt ?? DateTime.now()).toIso8601String(),
      };

  factory FeedPostModel.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final data = doc.data() ?? <String, dynamic>{};
    final rawComments = data['comments'] as List<dynamic>? ?? const [];
    final rawDappedBy = data['dappedBy'] as List<dynamic>? ?? const [];

    // Parse muscleVolumeMap from either top-level or nested workoutSummary
    final Map<String, int> parsedMuscleMap = {};
    final rawMuscleMap = data['muscleVolumeMap'] ??
        (data['workoutSummary'] is Map
            ? (data['workoutSummary'] as Map)['muscleVolumeMap']
            : null);
    if (rawMuscleMap is Map) {
      rawMuscleMap.forEach((key, value) {
        if (value is num) {
          parsedMuscleMap[key.toString()] = value.toInt();
        }
      });
    }

    // Parse RoutineModel from routineData or fallback to workoutSummary.exercises
    RoutineModel parsedRoutine;
    if (data['routineData'] is Map<String, dynamic>) {
      parsedRoutine = RoutineModel.fromJson(
        data['routineData'] as Map<String, dynamic>,
      );
    } else {
      final rawExercises = (data['workoutSummary'] is Map)
          ? ((data['workoutSummary'] as Map)['exercises'] as List<dynamic>? ??
              const [])
          : const [];
      parsedRoutine = RoutineModel(
        id: 'routine_${doc.id}',
        title: (data['title'] as String?) ?? 'Buổi tập Gym',
        creatorName: (data['userName'] as String?) ?? 'Gymer',
        exercises: rawExercises.map((e) {
          final exMap = e is Map ? e : const {};
          return RoutineExerciseModel(
            name: (exMap['name']?.toString()) ?? 'Barbell Bench Press',
            targetSets: (exMap['targetSets'] as num?)?.toInt() ?? 3,
            targetReps: (exMap['targetReps'] as num?)?.toInt() ?? 8,
            targetRpe: (exMap['targetRpe'] as num?)?.toDouble() ?? 8.5,
          );
        }).toList(),
      );
    }

    return FeedPostModel(
      id: (data['id'] as String?) ?? doc.id,
      userId: (data['userId'] as String?) ?? '',
      userName: (data['userName'] as String?) ?? 'Gymer',
      userAvatar: (data['userAvatar'] as String?) ?? '',
      userGym: (data['userGym'] as String?) ?? 'Strongman Gym',
      userBadge: data['userBadge'] as String?,
      title: (data['title'] as String?) ?? 'Buổi tập',
      caption: (data['caption'] as String?) ?? '',
      totalTonnageKg: (data['totalTonnageKg'] as num?)?.toInt() ?? 0,
      durationMinutes: (data['durationMinutes'] as num?)?.toInt() ?? 0,
      totalSets: (data['totalSets'] as num?)?.toInt() ?? 0,
      dapsCount: (data['dapsCount'] as num?)?.toInt() ?? 0,
      dappedBy: rawDappedBy.map((e) => e.toString()).toList(),
      commentsCount:
          (data['commentsCount'] as num?)?.toInt() ?? rawComments.length,
      comments: rawComments
          .whereType<Map>()
          .map((c) => PostCommentModel.fromMap(Map<String, dynamic>.from(c)))
          .toList(),
      forkCount: (data['forkCount'] as num?)?.toInt() ?? 0,
      prHighlight: data['prHighlight'] as String?,
      timestamp: (data['timestamp'] as String?) ?? 'Vừa xong',
      muscleVolumeMap: parsedMuscleMap,
      routineData: parsedRoutine,
      createdAt: _parseDateTime(data['createdAt']),
    );
  }
}

/// Logged workout session model synced with `/users/{userId}/sessions/{sessionId}`
class WorkoutSessionModel {
  final String id;
  final String userId;
  final String title;
  final String gymVenue;
  final int durationSeconds;
  final int totalTonnageKg;
  final int totalSets;
  final String visibility; // 'public' | 'friends' | 'private'
  final String caption;
  final String? prHighlight;
  final Map<String, int> muscleVolumeMap;
  final List<RoutineExerciseModel> exercises;
  final DateTime createdAt;

  WorkoutSessionModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.gymVenue,
    required this.durationSeconds,
    required this.totalTonnageKg,
    required this.totalSets,
    this.visibility = 'public',
    this.caption = '',
    this.prHighlight,
    this.muscleVolumeMap = const {},
    this.exercises = const [],
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toFirestore() => {
        'id': id,
        'userId': userId,
        'title': title,
        'gymVenue': gymVenue,
        'durationSeconds': durationSeconds,
        'totalTonnageKg': totalTonnageKg,
        'totalSets': totalSets,
        'visibility': visibility,
        'caption': caption,
        if (prHighlight != null) 'prHighlight': prHighlight,
        'muscleVolumeMap': muscleVolumeMap,
        'exercises': exercises.map((e) => e.toJson()).toList(),
        'createdAt': createdAt.toIso8601String(),
      };

  factory WorkoutSessionModel.fromFirestore(
    DocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final data = doc.data() ?? <String, dynamic>{};
    final rawExercises = data['exercises'] as List<dynamic>? ?? const [];
    final rawMuscleMap = data['muscleVolumeMap'] as Map<dynamic, dynamic>? ?? {};

    return WorkoutSessionModel(
      id: (data['id'] as String?) ?? doc.id,
      userId: (data['userId'] as String?) ?? '',
      title: (data['title'] as String?) ?? 'Buổi tập',
      gymVenue: (data['gymVenue'] as String?) ?? 'Strongman Gym',
      durationSeconds: (data['durationSeconds'] as num?)?.toInt() ?? 0,
      totalTonnageKg: (data['totalTonnageKg'] as num?)?.toInt() ?? 0,
      totalSets: (data['totalSets'] as num?)?.toInt() ?? 0,
      visibility: (data['visibility'] as String?) ?? 'public',
      caption: (data['caption'] as String?) ?? '',
      prHighlight: data['prHighlight'] as String?,
      muscleVolumeMap: rawMuscleMap.map(
        (k, v) => MapEntry(k.toString(), (v as num?)?.toInt() ?? 0),
      ),
      exercises: rawExercises
          .whereType<Map>()
          .map(
            (e) => RoutineExerciseModel.fromJson(Map<String, dynamic>.from(e)),
          )
          .toList(),
      createdAt: _parseDateTime(data['createdAt']) ?? DateTime.now(),
    );
  }
}

DateTime? _parseDateTime(dynamic raw) {
  if (raw == null) return null;
  if (raw is Timestamp) return raw.toDate();
  if (raw is String) return DateTime.tryParse(raw);
  return null;
}

/// Real-time Cloud Firestore DatabaseService replacing static mock_data.dart
class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  factory DatabaseService() => _instance;
  DatabaseService._internal();

  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  static const String usersCollection = 'users';
  static const String feedPostsCollection = 'feed_posts';
  static const String legacyPostsCollection = 'posts';
  static const String sessionsSubcollection = 'sessions';

  String? get currentUserId => _auth.currentUser?.uid;

  /// Structured error handler for Firestore permission and network diagnostics
  Never _handleFirestoreError(
    Object error,
    FirestoreOperationType operationType,
    String path,
  ) {
    final user = _auth.currentUser;
    final errInfo = {
      'error': error.toString(),
      'operationType': operationType.name,
      'path': path,
      'authInfo': {
        'userId': user?.uid,
        'email': user?.email,
        'emailVerified': user?.emailVerified,
        'isAnonymous': user?.isAnonymous,
        'tenantId': user?.tenantId,
        'providerInfo': user?.providerData
                .map((p) => {
                      'providerId': p.providerId,
                      'email': p.email,
                    })
                .toList() ??
            [],
      },
    };
    final encoded = jsonEncode(errInfo);
    debugPrint('Firestore Error: $encoded');
    throw Exception(encoded);
  }

  /// Validate live Firestore connection on startup (`test/connection`)
  Future<void> validateConnection() async {
    try {
      await _db
          .collection('test')
          .doc('connection')
          .get(const GetOptions(source: Source.server));
    } catch (e) {
      if (e.toString().contains('the client is offline')) {
        debugPrint('Please check your Firebase configuration.');
      }
    }
  }

  // ===========================================================================
  // 1. REAL-TIME FEED POSTS (Replaces mock feed posts)
  // ===========================================================================

  /// Stream real-time community workout posts from `/feed_posts`
  Stream<List<FeedPostModel>> streamFeedPosts({int limit = 50}) {
    return _db
        .collection(feedPostsCollection)
        .orderBy('createdAt', descending: true)
        .limit(limit)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => FeedPostModel.fromFirestore(doc))
              .toList(),
        )
        .handleError((Object error) {
      _handleFirestoreError(
        error,
        FirestoreOperationType.list,
        feedPostsCollection,
      );
    });
  }

  /// One-time fetch of latest community workout posts
  Future<List<FeedPostModel>> fetchFeedPosts({int limit = 50}) async {
    try {
      final snapshot = await _db
          .collection(feedPostsCollection)
          .orderBy('createdAt', descending: true)
          .limit(limit)
          .get();
      return snapshot.docs
          .map((doc) => FeedPostModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      _handleFirestoreError(
        e,
        FirestoreOperationType.list,
        feedPostsCollection,
      );
    }
  }

  /// Atomically increment or decrement Daps count on a feed post
  Future<void> updatePostDaps({
    required String postId,
    required int delta,
    String? userId,
  }) async {
    final path = '$feedPostsCollection/$postId';
    try {
      final updates = <String, dynamic>{
        'dapsCount': FieldValue.increment(delta),
      };
      if (userId != null && userId.isNotEmpty) {
        updates['dappedBy'] = delta > 0
            ? FieldValue.arrayUnion([userId])
            : FieldValue.arrayRemove([userId]);
      }
      await _db.collection(feedPostsCollection).doc(postId).update(updates);
    } catch (e) {
      _handleFirestoreError(e, FirestoreOperationType.update, path);
    }
  }

  /// Add a comment to a feed post in real-time
  Future<void> addCommentToPost({
    required String postId,
    required PostCommentModel comment,
  }) async {
    final path = '$feedPostsCollection/$postId';
    try {
      await _db.collection(feedPostsCollection).doc(postId).update({
        'commentsCount': FieldValue.increment(1),
        'comments': FieldValue.arrayUnion([comment.toMap()]),
      });
    } catch (e) {
      _handleFirestoreError(e, FirestoreOperationType.update, path);
    }
  }

  /// Increment fork count when a user taps "Xin lịch" on a post
  Future<void> incrementRoutineForkCount(String postId) async {
    final path = '$feedPostsCollection/$postId';
    try {
      await _db.collection(feedPostsCollection).doc(postId).update({
        'forkCount': FieldValue.increment(1),
      });
    } catch (e) {
      _handleFirestoreError(e, FirestoreOperationType.update, path);
    }
  }

  /// Delete a feed post owned by the current user
  Future<void> deleteFeedPost(String postId) async {
    final path = '$feedPostsCollection/$postId';
    try {
      await _db.collection(feedPostsCollection).doc(postId).delete();
    } catch (e) {
      _handleFirestoreError(e, FirestoreOperationType.delete, path);
    }
  }

  // ===========================================================================
  // 2. REAL-TIME WORKOUT SESSIONS & ATOMIC BATCH PUBLISH
  // ===========================================================================

  /// Stream a user's logged workout sessions in real-time (`/users/{userId}/sessions`)
  Stream<List<WorkoutSessionModel>> streamUserWorkoutSessions(
    String userId, {
    int limit = 50,
  }) {
    final path = '$usersCollection/$userId/$sessionsSubcollection';
    return _db
        .collection(usersCollection)
        .doc(userId)
        .collection(sessionsSubcollection)
        .orderBy('createdAt', descending: true)
        .limit(limit)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => WorkoutSessionModel.fromFirestore(doc))
              .toList(),
        )
        .handleError((Object error) {
      _handleFirestoreError(error, FirestoreOperationType.list, path);
    });
  }

  /// Save a completed workout session and atomically publish to community feed
  Future<void> saveWorkoutSessionAndPublish({
    required WorkoutSessionModel session,
    required UserProfileModel author,
  }) async {
    final sessionPath =
        '$usersCollection/${session.userId}/$sessionsSubcollection/${session.id}';
    try {
      final batch = _db.batch();

      // 1. Save workout session under /users/{userId}/sessions/{sessionId}
      final sessionRef = _db
          .collection(usersCollection)
          .doc(session.userId)
          .collection(sessionsSubcollection)
          .doc(session.id);
      batch.set(sessionRef, session.toFirestore());

      // 2. If visibility is not private, publish to /feed_posts/{postId} & /posts/{postId}
      if (session.visibility != 'private') {
        final postId = 'post_${session.id}';
        final feedPost = FeedPostModel(
          id: postId,
          userId: author.id,
          userName: author.name,
          userAvatar: author.avatar,
          userGym: session.gymVenue,
          title: session.title,
          caption: session.caption.isNotEmpty
              ? session.caption
              : 'Đã hoàn thành buổi tập tại ${session.gymVenue}! 🔥',
          totalTonnageKg: session.totalTonnageKg,
          durationMinutes: (session.durationSeconds / 60).ceil().clamp(1, 600),
          totalSets: session.totalSets,
          prHighlight: session.prHighlight,
          timestamp: 'Vừa xong',
          muscleVolumeMap: session.muscleVolumeMap,
          routineData: RoutineModel(
            id: 'routine_${session.id}',
            title: session.title,
            creatorName: author.name,
            exercises: session.exercises,
          ),
          createdAt: session.createdAt,
        );

        final feedPostRef = _db.collection(feedPostsCollection).doc(postId);
        final legacyPostRef = _db.collection(legacyPostsCollection).doc(postId);
        batch.set(feedPostRef, feedPost.toFirestore());
        batch.set(legacyPostRef, feedPost.toFirestore());
      }

      await batch.commit();
    } catch (e) {
      _handleFirestoreError(e, FirestoreOperationType.write, sessionPath);
    }
  }

  // ===========================================================================
  // 3. REAL-TIME USER PROFILES & GYM BUDDIES (Replaces mock buddies & profile)
  // ===========================================================================

  /// Stream a single user profile in real-time (`/users/{userId}`)
  Stream<UserProfileModel?> streamUserProfile(String userId) {
    final path = '$usersCollection/$userId';
    return _db
        .collection(usersCollection)
        .doc(userId)
        .snapshots()
        .map((doc) => doc.exists ? UserProfileModel.fromFirestore(doc) : null)
        .handleError((Object error) {
      _handleFirestoreError(error, FirestoreOperationType.get, path);
    });
  }

  /// Fetch a user profile once from Firestore
  Future<UserProfileModel?> getUserProfile(String userId) async {
    final path = '$usersCollection/$userId';
    try {
      final doc = await _db.collection(usersCollection).doc(userId).get();
      if (!doc.exists) return null;
      return UserProfileModel.fromFirestore(doc);
    } catch (e) {
      _handleFirestoreError(e, FirestoreOperationType.get, path);
    }
  }

  /// Create or update user profile document in `/users/{userId}`
  Future<void> upsertUserProfile(UserProfileModel profile) async {
    final path = '$usersCollection/${profile.id}';
    try {
      await _db
          .collection(usersCollection)
          .doc(profile.id)
          .set(profile.toFirestore(), SetOptions(merge: true));
    } catch (e) {
      _handleFirestoreError(e, FirestoreOperationType.write, path);
    }
  }

  /// Stream real-time list of Gym Buddies from `/users`
  Stream<List<GymBuddyModel>> streamGymBuddies({int limit = 30}) {
    return _db
        .collection(usersCollection)
        .limit(limit)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .where((doc) => doc.id != currentUserId)
              .map((doc) => GymBuddyModel.fromFirestore(doc))
              .toList(),
        )
        .handleError((Object error) {
      _handleFirestoreError(
        error,
        FirestoreOperationType.list,
        usersCollection,
      );
    });
  }

  /// Search for a Gym Buddy by handle (`@username`) or email in `/users`
  Future<GymBuddyModel?> findUserByHandleOrEmail(String query) async {
    final clean = query.trim().toLowerCase();
    if (clean.isEmpty) return null;
    final cleanHandle = clean.startsWith('@') ? clean : '@$clean';

    try {
      final snapshot = await _db.collection(usersCollection).limit(50).get();
      for (final doc in snapshot.docs) {
        final data = doc.data();
        final email = (data['email'] as String?)?.toLowerCase() ?? '';
        final handle = (data['handle'] as String?)?.toLowerCase() ?? '';
        final name = (data['name'] as String?)?.toLowerCase() ?? '';

        if (email == clean ||
            handle == clean ||
            handle == cleanHandle ||
            name == clean) {
          return GymBuddyModel.fromFirestore(doc);
        }
      }
      return null;
    } catch (e) {
      _handleFirestoreError(e, FirestoreOperationType.list, usersCollection);
    }
  }
}
