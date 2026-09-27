// lib/models/exercise_model.dart

enum MuscleGroup {
  chest,
  lats,
  upperBack,
  lowerBack,
  quads,
  glutes,
  calves,
  frontDelts,
  sideDelts,
  rearDelts,
  biceps,
  triceps,
  abs,
}

enum EquipmentType {
  barbell,
  dumbbell,
  cable,
  machine,
  bodyweight,
}

class ExerciseDefinition {
  final String id;
  final String nameVn;
  final String nameEn;
  final EquipmentType equipment;
  final List<MuscleGroup> primaryMuscles;
  final List<MuscleGroup> secondaryMuscles;

  const ExerciseDefinition({
    required this.id,
    required this.nameVn,
    required this.nameEn,
    required this.equipment,
    required this.primaryMuscles,
    required this.secondaryMuscles,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'nameVn': nameVn,
    'nameEn': nameEn,
    'equipment': equipment.name,
    'primaryMuscles': primaryMuscles.map((m) => m.name).toList(),
    'secondaryMuscles': secondaryMuscles.map((m) => m.name).toList(),
  };

  factory ExerciseDefinition.fromJson(Map<String, dynamic> json) {
    return ExerciseDefinition(
      id: json['id'] as String? ?? '',
      nameVn: json['nameVn'] as String? ?? json['nameEn'] as String? ?? '',
      nameEn: json['nameEn'] as String? ?? json['name'] as String? ?? '',
      equipment: EquipmentType.values.firstWhere(
        (e) => e.name == json['equipment'],
        orElse: () => EquipmentType.bodyweight,
      ),
      primaryMuscles: (json['primaryMuscles'] as List<dynamic>? ?? [])
          .map((m) => MuscleGroup.values.firstWhere((g) => g.name == m.toString(), orElse: () => MuscleGroup.chest))
          .toList(),
      secondaryMuscles: (json['secondaryMuscles'] as List<dynamic>? ?? [])
          .map((m) => MuscleGroup.values.firstWhere((g) => g.name == m.toString(), orElse: () => MuscleGroup.upperBack))
          .toList(),
    );
  }
}
