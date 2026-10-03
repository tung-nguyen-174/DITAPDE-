// lib/models/exercise_model.dart

enum MuscleGroup {
  chest,
  lats,
  traps,
  neck,
  upperBack,
  lowerBack,
  quads,
  adductors,
  abductors,
  hamstrings,
  glutes,
  calves,
  frontDelts,
  sideDelts,
  rearDelts,
  biceps,
  triceps,
  forearms,
  abs;

  /// Maps raw muscle strings from `assets/data/exercises.json`
  /// to the canonical [MuscleGroup] enum used by `MuscleHeatmap`.
  static MuscleGroup fromJsonMuscleName(String raw) {
    final normalized = raw.toLowerCase().trim().replaceAll(RegExp(r'\s+'), '_');
    switch (normalized) {
      case 'chest':
      case 'pectoralis':
      case 'upper_chest':
      case 'lower_chest':
        return MuscleGroup.chest;
      case 'lats':
      case 'latissimus_dorsi':
        return MuscleGroup.lats;
      case 'traps':
      case 'trapezius':
        return MuscleGroup.traps;
      case 'neck':
        return MuscleGroup.neck;
      case 'middle_back':
      case 'upper_back':
      case 'upperback':
      case 'rhomboids':
        return MuscleGroup.upperBack;
      case 'lower_back':
      case 'lowerback':
      case 'erector_spinae':
        return MuscleGroup.lowerBack;
      case 'quadriceps':
      case 'quads':
        return MuscleGroup.quads;
      case 'adductors':
      case 'adductor':
      case 'inner_thigh':
      case 'groin':
        return MuscleGroup.adductors;
      case 'abductors':
      case 'abductor':
      case 'outer_thigh':
        return MuscleGroup.abductors;
      case 'hamstrings':
        return MuscleGroup.hamstrings;
      case 'glutes':
      case 'gluteus_maximus':
        return MuscleGroup.glutes;
      case 'calves':
      case 'gastrocnemius':
        return MuscleGroup.calves;
      case 'shoulders':
      case 'front_delts':
      case 'frontdelts':
      case 'anterior_deltoid':
        return MuscleGroup.frontDelts;
      case 'side_delts':
      case 'sidedelts':
      case 'lateral_deltoid':
        return MuscleGroup.sideDelts;
      case 'rear_delts':
      case 'reardelts':
      case 'posterior_deltoid':
        return MuscleGroup.rearDelts;
      case 'biceps':
      case 'biceps_brachii':
        return MuscleGroup.biceps;
      case 'forearms':
      case 'forearm':
        return MuscleGroup.forearms;
      case 'triceps':
      case 'triceps_brachii':
        return MuscleGroup.triceps;
      case 'abdominals':
      case 'abs':
      case 'obliques':
        return MuscleGroup.abs;
      default:
        return MuscleGroup.chest;
    }
  }
}

enum EquipmentType {
  barbell,
  dumbbell,
  cable,
  machine,
  bodyweight,
  other,
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
    final rawEquipment = (json['equipment'] as String? ?? 'body only').toLowerCase();
    final EquipmentType parsedEquipment;
    if (rawEquipment.contains('barbell')) {
      parsedEquipment = EquipmentType.barbell;
    } else if (rawEquipment.contains('dumbbell')) {
      parsedEquipment = EquipmentType.dumbbell;
    } else if (rawEquipment.contains('cable')) {
      parsedEquipment = EquipmentType.cable;
    } else if (rawEquipment.contains('machine')) {
      parsedEquipment = EquipmentType.machine;
    } else if (rawEquipment.contains('body')) {
      parsedEquipment = EquipmentType.bodyweight;
    } else {
      parsedEquipment = EquipmentType.other;
    }

    return ExerciseDefinition(
      id: json['id'] as String? ?? json['name'] as String? ?? '',
      nameVn: json['nameVn'] as String? ?? json['name'] as String? ?? '',
      nameEn: json['nameEn'] as String? ?? json['name'] as String? ?? '',
      equipment: parsedEquipment,
      primaryMuscles: (json['primaryMuscles'] as List<dynamic>? ?? [])
          .map((m) => MuscleGroup.fromJsonMuscleName(m.toString()))
          .toList(),
      secondaryMuscles: (json['secondaryMuscles'] as List<dynamic>? ?? [])
          .map((m) => MuscleGroup.fromJsonMuscleName(m.toString()))
          .toList(),
    );
  }
}
