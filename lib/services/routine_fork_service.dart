// lib/services/routine_fork_service.dart

import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class RoutineExerciseModel {
  final String name;
  final int targetSets;
  final int targetReps;
  final double targetRpe;

  RoutineExerciseModel({
    required this.name,
    required this.targetSets,
    required this.targetReps,
    required this.targetRpe,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'targetSets': targetSets,
        'targetReps': targetReps,
        'targetRpe': targetRpe,
      };

  factory RoutineExerciseModel.fromJson(Map<String, dynamic> json) =>
      RoutineExerciseModel(
        name: json['name'],
        targetSets: json['targetSets'],
        targetReps: json['targetReps'],
        targetRpe: (json['targetRpe'] as num).toDouble(),
      );
}

class RoutineModel {
  final String id;
  final String title;
  final String creatorName;
  final List<RoutineExerciseModel> exercises;

  RoutineModel({
    required this.id,
    required this.title,
    required this.creatorName,
    required this.exercises,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'creatorName': creatorName,
        'exercises': exercises.map((e) => e.toJson()).toList(),
      };

  factory RoutineModel.fromJson(Map<String, dynamic> json) => RoutineModel(
        id: json['id'],
        title: json['title'],
        creatorName: json['creatorName'],
        exercises: (json['exercises'] as List)
            .map((e) => RoutineExerciseModel.fromJson(e))
            .toList(),
      );
}

class RoutineForkService {
  static const String _savedRoutinesKey = 'gym_chuot_saved_routines';

  /// 1-Tap Fork Routine from Feed Post to Local Storage
  static Future<bool> forkRoutine(RoutineModel publicRoutine) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      List<String> rawList = prefs.getStringList(_savedRoutinesKey) ?? [];

      // Create cloned routine object with new ID & Fork Tag
      final clonedRoutine = RoutineModel(
        id: 'fork_${DateTime.now().millisecondsSinceEpoch}',
        title: '${publicRoutine.title} (Fork từ ${publicRoutine.creatorName})',
        creatorName: publicRoutine.creatorName,
        exercises: publicRoutine.exercises,
      );

      rawList.add(jsonEncode(clonedRoutine.toJson()));
      await prefs.setStringList(_savedRoutinesKey, rawList);
      return true;
    } catch (e) {
      print('Error forking routine: $e');
      return false;
    }
  }

  /// Get all saved / forked routines
  static Future<List<RoutineModel>> getSavedRoutines() async {
    final prefs = await SharedPreferences.getInstance();
    List<String> rawList = prefs.getStringList(_savedRoutinesKey) ?? [];
    return rawList
        .map((item) => RoutineModel.fromJson(jsonDecode(item)))
        .toList();
  }

  /// Create a Custom Routine from the app's exercise catalog and save to Local Storage
  static Future<bool> createCustomRoutine({
    required String title,
    required String creatorName,
    required List<RoutineExerciseModel> exercises,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      List<String> rawList = prefs.getStringList(_savedRoutinesKey) ?? [];

      final customRoutine = RoutineModel(
        id: 'custom_${DateTime.now().millisecondsSinceEpoch}',
        title: title,
        creatorName: creatorName,
        exercises: exercises,
      );

      rawList.insert(0, jsonEncode(customRoutine.toJson()));
      await prefs.setStringList(_savedRoutinesKey, rawList);
      return true;
    } catch (e) {
      print('Error creating custom routine: $e');
      return false;
    }
  }

  /// Delete a saved routine by ID
  static Future<bool> deleteRoutine(String routineId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      List<String> rawList = prefs.getStringList(_savedRoutinesKey) ?? [];
      rawList.removeWhere((item) {
        final decoded = jsonDecode(item) as Map<String, dynamic>;
        return decoded['id'] == routineId;
      });
      await prefs.setStringList(_savedRoutinesKey, rawList);
      return true;
    } catch (e) {
      print('Error deleting routine: $e');
      return false;
    }
  }
}
