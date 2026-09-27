// lib/services/nudge_service.dart

import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class NudgeService {
  static final NudgeService _instance = NudgeService._internal();
  factory NudgeService() => _instance;
  NudgeService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Initialize FCM permissions, store token in `fcmTokens` array on `/users/{userId}`,
  /// and subscribe to token refresh events.
  Future<void> init(String currentUserId) async {
    final NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      final String? token = await _fcm.getToken();
      if (token != null && token.isNotEmpty) {
        await _saveDeviceToken(currentUserId, token);
      }

      // Listen for FCM token refreshes on this device
      _fcm.onTokenRefresh.listen((String newToken) {
        if (newToken.isNotEmpty) {
          _saveDeviceToken(currentUserId, newToken);
        }
      });
    }
  }

  /// Stores the device token inside `/users/{userId}` `fcmTokens` array
  Future<void> _saveDeviceToken(String userId, String token) async {
    try {
      await _db.collection('users').doc(userId).set(
        {
          'fcmTokens': FieldValue.arrayUnion([token]),
          'fcmToken': token,
          'lastTokenUpdate': FieldValue.serverTimestamp(),
        },
        SetOptions(merge: true),
      );
    } catch (e) {
      debugPrint('Error saving FCM token to /users/$userId: $e');
    }
  }

  /// Removes the current device token from `/users/{userId}.fcmTokens` on sign-out
  Future<void> removeCurrentDeviceToken(String userId) async {
    try {
      final String? token = await _fcm.getToken();
      if (token != null && token.isNotEmpty) {
        await _db.collection('users').doc(userId).update({
          'fcmTokens': FieldValue.arrayRemove([token]),
        });
      }
    } catch (e) {
      debugPrint('Error removing FCM token on sign out: $e');
    }
  }

  /// Triggers a real-time "Đi tập đê!" push notification by writing to `/nudges_log/{logId}`
  /// (which invokes the `onNudgeCreated` Firestore Cloud Function trigger) and/or calling
  /// the `sendNudgeNotification` HTTPS Callable gateway.
  Future<bool> sendDitapdeNudge({
    required String senderId,
    required String senderName,
    required String targetUserId,
    String? customMessage,
  }) async {
    try {
      final String messageBody =
          (customMessage != null && customMessage.trim().isNotEmpty)
              ? customMessage.trim()
              : '$senderName sent you a nudge!';

      // 1. Write document to /nudges_log/{logId} to trigger `exports.onNudgeCreated`
      try {
        await _db.collection('nudges_log').add({
          'senderId': senderId,
          'senderName': senderName,
          'recipientId': targetUserId,
          'targetUserId': targetUserId,
          'message': messageBody,
          'createdAt': FieldValue.serverTimestamp(),
        });
        return true;
      } catch (firestoreError) {
        debugPrint(
          'Firestore /nudges_log write fallback to callable: $firestoreError',
        );
      }

      // 2. Fallback: Invoke HTTPS Callable Cloud Function `sendNudgeNotification`
      try {
        final HttpsCallable callable =
            _functions.httpsCallable('sendNudgeNotification');
        final HttpsCallableResult<dynamic> result = await callable.call({
          'targetUserId': targetUserId,
          'recipientId': targetUserId,
          'senderId': senderId,
          'senderName': senderName,
          'message': messageBody,
        });

        final responseData = result.data;
        if (responseData is Map && responseData['success'] == true) {
          return true;
        }
      } catch (callableError) {
        debugPrint(
          'Callable sendNudgeNotification fallback notice: $callableError',
        );
      }

      // 3. Fallback HTTP Endpoint if custom Cloud Function URL is configured
      final DocumentSnapshot<Map<String, dynamic>> userDoc =
          await _db.collection('users').doc(targetUserId).get();
      if (!userDoc.exists) return false;

      final data = userDoc.data();
      final List<dynamic> tokenList =
          (data?['fcmTokens'] as List<dynamic>?) ?? [];
      final String? fallbackToken = tokenList.isNotEmpty
          ? tokenList.first.toString()
          : (data?['fcmToken'] as String?);

      if (fallbackToken == null || fallbackToken.isEmpty) {
        return false;
      }

      final String? idToken = await _auth.currentUser?.getIdToken();
      final response = await http.post(
        Uri.parse(
          'https://asia-southeast1-project-8129dcb9-c383-42e8-b10.cloudfunctions.net/sendNudgeNotification',
        ),
        headers: {
          'Content-Type': 'application/json',
          if (idToken != null) 'Authorization': 'Bearer $idToken',
        },
        body: jsonEncode({
          'data': {
            'targetUserId': targetUserId,
            'recipientId': targetUserId,
            'targetToken': fallbackToken,
            'senderId': senderId,
            'senderName': senderName,
            'message': messageBody,
          },
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error sending nudge: $e');
      return false;
    }
  }
}
