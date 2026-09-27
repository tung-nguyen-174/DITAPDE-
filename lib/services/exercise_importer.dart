// lib/services/exercise_importer.dart

import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;
import '../models/exercise_model.dart';
import '../utils/exercise_validator.dart';

class ExerciseImporter {
  /// Converts English muscle tags from external datasets to DITAPDE's MuscleGroup enum
  static MuscleGroup _mapStringToMuscleGroup(String rawMuscle) {
    final clean = rawMuscle.toLowerCase().trim().replaceAll(' ', '_');
    switch (clean) {
      case 'chest':
      case 'upper_chest':
      case 'lower_chest':
      case 'pectoralis':
        return MuscleGroup.chest;
      case 'lats':
      case 'latissimus_dorsi':
        return MuscleGroup.lats;
      case 'upper_back':
      case 'traps':
      case 'trapezius':
      case 'rhomboids':
        return MuscleGroup.upperBack;
      case 'lower_back':
      case 'erector_spinae':
        return MuscleGroup.lowerBack;
      case 'quads':
      case 'quadriceps':
        return MuscleGroup.quads;
      case 'hamstrings':
      case 'gluteus_maximus':
      case 'glutes':
        return MuscleGroup.glutes;
      case 'calves':
      case 'gastrocnemius':
        return MuscleGroup.calves;
      case 'front_delts':
      case 'shoulders':
      case 'anterior_deltoid':
        return MuscleGroup.frontDelts;
      case 'side_delts':
      case 'lateral_deltoid':
        return MuscleGroup.sideDelts;
      case 'rear_delts':
      case 'posterior_deltoid':
        return MuscleGroup.rearDelts;
      case 'biceps':
      case 'biceps_brachii':
        return MuscleGroup.biceps;
      case 'triceps':
      case 'triceps_brachii':
        return MuscleGroup.triceps;
      case 'abs':
      case 'abdominals':
      case 'obliques':
        return MuscleGroup.abs;
      default:
        return MuscleGroup.upperBack;
    }
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
