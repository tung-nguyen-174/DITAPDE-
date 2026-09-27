// lib/repositories/exercise_repository.dart

import '../models/exercise_model.dart';
import '../services/exercise_importer.dart';

class ExerciseRepository {
  static final ExerciseRepository _instance = ExerciseRepository._internal();
  factory ExerciseRepository() => _instance;
  ExerciseRepository._internal();

  List<ExerciseDefinition>? _cachedExercises;

  Future<List<ExerciseDefinition>> getAllExercises() async {
    if (_cachedExercises != null) {
      return _cachedExercises!;
    }
    _cachedExercises = await ExerciseImporter.loadLocalDataset();
    return _cachedExercises!;
  }

  Future<List<ExerciseDefinition>> searchExercises({
    String query = '',
    String category = 'All',
  }) async {
    final list = await getAllExercises();
    final q = query.trim().toLowerCase();

    return list.where((ex) {
      // 1. Muscle category filter
      if (category != 'All') {
        bool matchesMuscle = false;
        switch (category) {
          case 'Ngực (Chest)':
            matchesMuscle = ex.primaryMuscles.contains(MuscleGroup.chest);
            break;
          case 'Lưng (Back)':
            matchesMuscle = ex.primaryMuscles.contains(MuscleGroup.lats) ||
                ex.primaryMuscles.contains(MuscleGroup.upperBack) ||
                ex.primaryMuscles.contains(MuscleGroup.lowerBack);
            break;
          case 'Vai (Shoulders)':
            matchesMuscle = ex.primaryMuscles.contains(MuscleGroup.frontDelts) ||
                ex.primaryMuscles.contains(MuscleGroup.sideDelts) ||
                ex.primaryMuscles.contains(MuscleGroup.rearDelts);
            break;
          case 'Tay (Arms)':
            matchesMuscle = ex.primaryMuscles.contains(MuscleGroup.biceps) ||
                ex.primaryMuscles.contains(MuscleGroup.triceps);
            break;
          case 'Chân (Legs)':
            matchesMuscle = ex.primaryMuscles.contains(MuscleGroup.quads) ||
                ex.primaryMuscles.contains(MuscleGroup.glutes) ||
                ex.primaryMuscles.contains(MuscleGroup.calves);
            break;
          case 'Bụng (Abs)':
            matchesMuscle = ex.primaryMuscles.contains(MuscleGroup.abs);
            break;
          default:
            matchesMuscle = true;
        }
        if (!matchesMuscle) return false;
      }

      // 2. Query filter (Vietnamese or English name, or equipment)
      if (q.isNotEmpty) {
        final vn = ex.nameVn.toLowerCase();
        final en = ex.nameEn.toLowerCase();
        final eq = ex.equipment.name.toLowerCase();
        if (!vn.contains(q) && !en.contains(q) && !eq.contains(q)) {
          return false;
        }
      }

      return true;
    }).toList();
  }
}
