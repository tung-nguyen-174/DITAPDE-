// lib/services/auth_service.dart

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
      debugPrint('Error signing in anonymously: $e');
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
      debugPrint('Error signing in with Google: $e');
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
      final fullName = '$familyName $givenName'.trim();
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
      debugPrint('Error signing in with Apple: $e');
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

  /// Đồng bộ thông tin hồ sơ người dùng lên `/users/{userId}` theo chuẩn schema bảo mật
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
      debugPrint('Error syncing user document: $e');
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
      debugPrint('Error signing out: $e');
      rethrow;
    }
  }
}
