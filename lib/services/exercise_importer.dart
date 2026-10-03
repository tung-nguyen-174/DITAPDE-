// lib/services/exercise_importer.dart

import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;
import '../models/exercise_model.dart';
import '../utils/exercise_validator.dart';

class ExerciseImporter {
  /// Converts English muscle tags from `assets/data/exercises.json` to DITAPDE's MuscleGroup enum
  static MuscleGroup _mapStringToMuscleGroup(String rawMuscle) {
    return MuscleGroup.fromJsonMuscleName(rawMuscle);
  }

  static EquipmentType _mapEquipment(String rawEquipment) {
    final clean = rawEquipment.toLowerCase();
    if (clean.contains('barbell')) return EquipmentType.barbell;
    if (clean.contains('dumbbell')) return EquipmentType.dumbbell;
    if (clean.contains('cable')) return EquipmentType.cable;
    if (clean.contains('machine')) return EquipmentType.machine;
    return EquipmentType.bodyweight;
  }

  /// Parses the asset JSON and returns strong ExerciseDefinition objects
  static Future<List<ExerciseDefinition>> loadLocalDataset() async {
    final String jsonString = await rootBundle.loadString('assets/data/exercises.json');
    final dynamic decoded = json.decode(jsonString);
    
    // Supports both direct List or { "exercises": [...] } format
    final List<dynamic> parsedList = decoded is List
        ? decoded
        : (decoded is Map<String, dynamic> && decoded.containsKey('exercises')
            ? (decoded['exercises'] as List<dynamic>? ?? [])
            : []);

    final List<ExerciseDefinition> catalog = [];

    for (var item in parsedList) {
      if (item is! Map<String, dynamic>) continue;
      final String id = item['id']?.toString() ?? item['name'].toString().toLowerCase().replaceAll(' ', '_');
      final String nameEn = item['name']?.toString() ?? 'Unknown Exercise';
      final String nameVn = item['nameVn']?.toString() ?? nameEn; // Auto-fallback to English name if VN translation is missing

      final List<dynamic> rawPrimary = item['primaryMuscles'] ?? [];
      final List<dynamic> rawSecondary = item['secondaryMuscles'] ?? [];

      final primaryMuscles = rawPrimary.map((m) => _mapStringToMuscleGroup(m.toString())).toList();
      final secondaryMuscles = rawSecondary.map((m) => _mapStringToMuscleGroup(m.toString())).toList();

      final exercise = ExerciseDefinition(
        id: id,
        nameVn: nameVn,
        nameEn: nameEn,
        equipment: _mapEquipment(item['equipment']?.toString() ?? ''),
        primaryMuscles: primaryMuscles.isEmpty ? [MuscleGroup.chest] : primaryMuscles,
        secondaryMuscles: secondaryMuscles,
      );

      if (ExerciseValidator.isValidExercise(exercise)) {
        catalog.add(exercise);
      }
    }

    return catalog;
  }
}
