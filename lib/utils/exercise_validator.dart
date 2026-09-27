// lib/utils/exercise_validator.dart

import '../models/exercise_model.dart';

class ExerciseValidator {
  static bool isValidExercise(ExerciseDefinition exercise) {
    if (exercise.id.isEmpty) return false;
    if (exercise.nameEn.isEmpty && exercise.nameVn.isEmpty) return false;
    if (exercise.primaryMuscles.isEmpty) return false;
    return true;
  }

  static String sanitizeId(String name) {
    return name
        .toLowerCase()
        .trim()
        .replaceAll(RegExp(r'[^a-z0-9_]'), '_')
        .replaceAll(RegExp(r'_+'), '_');
  }
}
