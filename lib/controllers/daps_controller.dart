// lib/controllers/daps_controller.dart

import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class DapsController extends ChangeNotifier {
  final String postId;
  int _localDapsCount;
  int _pendingDelta = 0;
  Timer? _debounceTimer;

  final FirebaseFirestore _db = FirebaseFirestore.instance;

  DapsController({
    required this.postId,
    required int initialDapsCount,
  }) : _localDapsCount = initialDapsCount;

  int get dapsCount => _localDapsCount;
  bool get hasPendingDaps => _pendingDelta > 0;

  /// Optimistic UI increment with 1-second debounce batching
  void addDap() {
    // 1. Optimistic UI update
    _localDapsCount++;
    _pendingDelta++;
    notifyListeners();

    // 2. Cancel previous timer if user is spam-tapping
    _debounceTimer?.cancel();

    // 3. Set 1-second debounce before flushing to Firestore
    _debounceTimer = Timer(const Duration(seconds: 1), _flushDapsToFirestore);
  }

  /// Flushes pending daps delta to Firestore in a single atomic increment
  Future<void> _flushDapsToFirestore() async {
    if (_pendingDelta == 0) return;

    final int deltaToCommit = _pendingDelta;
    _pendingDelta = 0; // Reset pending delta before async call

    try {
      await _db.collection('feed_posts').doc(postId).update({
        'dapsCount': FieldValue.increment(deltaToCommit),
      });
    } catch (e) {
      // Revert optimistic count on network failure
      _localDapsCount -= deltaToCommit;
      notifyListeners();
      print('Failed to sync daps to Firestore: $e');
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _flushDapsToFirestore(); // Ensure remaining daps are written on widget unmount
    super.dispose();
  }
}
