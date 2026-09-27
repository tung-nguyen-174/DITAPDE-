// lib/providers/check_in_provider.dart

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/gym_location_model.dart';

class CheckInProvider extends ChangeNotifier {
  static const String _activeCheckInPrefsKey = 'gym_chuot_active_gym_checkin';

  GymLocationModel? _activeGymCheckIn;

  GymLocationModel? get activeGymCheckIn => _activeGymCheckIn;

  bool get hasActiveCheckIn => _activeGymCheckIn != null;

  /// Sets the active gym check-in, persists JSON to SharedPreferences, and notifies listeners
  Future<void> checkIn(GymLocationModel gym) async {
    _activeGymCheckIn = gym;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_activeCheckInPrefsKey, jsonEncode(gym.toJson()));
    } catch (e) {
      debugPrint('Error saving active gym check-in: $e');
    }
  }

  /// Restores the saved gym check-in from SharedPreferences on app start
  Future<void> loadSavedCheckIn() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final rawJson = prefs.getString(_activeCheckInPrefsKey);
      if (rawJson != null && rawJson.isNotEmpty) {
        final decoded = jsonDecode(rawJson) as Map<String, dynamic>;
        _activeGymCheckIn = GymLocationModel.fromJson(decoded);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error loading saved gym check-in: $e');
    }
  }

  /// Clears active check-in
  Future<void> clearCheckIn() async {
    _activeGymCheckIn = null;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_activeCheckInPrefsKey);
    } catch (e) {
      debugPrint('Error clearing gym check-in: $e');
    }
  }
}
