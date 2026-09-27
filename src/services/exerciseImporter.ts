// src/services/exerciseImporter.ts
import exercisesData from '../assets/data/exercises.json';
import { MuscleGroup, WorkoutExercise } from '../types/gym';

export interface RawExerciseItem {
  name: string;
  nameVn?: string;
  force?: string | null;
  level?: string;
  mechanic?: string | null;
  equipment?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  category?: string;
}

export function mapStringToMuscleGroup(rawMuscle: string): MuscleGroup {
  const clean = rawMuscle.toLowerCase().trim().replace(/\s+/g, '_');
  switch (clean) {
    case 'chest':
    case 'upper_chest':
    case 'lower_chest':
    case 'pectoralis':
      return 'chest';
    case 'lats':
    case 'latissimus_dorsi':
      return 'lats';
    case 'upper_back':
    case 'traps':
    case 'trapezius':
    case 'rhomboids':
    case 'middle_back':
      return 'upper_back';
    case 'lower_back':
    case 'erector_spinae':
      return 'lower_back';
    case 'quads':
    case 'quadriceps':
      return 'quads';
    case 'hamstrings':
      return 'hamstrings';
    case 'gluteus_maximus':
    case 'glutes':
      return 'glutes';
    case 'calves':
    case 'gastrocnemius':
      return 'calves';
    case 'front_delts':
    case 'shoulders':
    case 'anterior_deltoid':
      return 'front_delts';
    case 'side_delts':
    case 'lateral_deltoid':
      return 'side_delts';
    case 'rear_delts':
    case 'posterior_deltoid':
      return 'rear_delts';
    case 'biceps':
    case 'biceps_brachii':
    case 'forearms':
      return 'biceps';
    case 'triceps':
    case 'triceps_brachii':
      return 'triceps';
    case 'abs':
    case 'abdominals':
    case 'obliques':
      return 'abs';
    default:
      return 'upper_back';
  }
}

export const ALL_RAW_EXERCISES: RawExerciseItem[] = (exercisesData as any).exercises || [];

export function searchExerciseCatalog(
  keyword: string,
  filterMuscle?: MuscleGroup,
  limit = 30
): RawExerciseItem[] {
  const q = keyword.toLowerCase().trim();
  return ALL_RAW_EXERCISES.filter((item) => {
    if (filterMuscle) {
      const match = item.primaryMuscles?.some(
        (m) => mapStringToMuscleGroup(m) === filterMuscle
      );
      if (!match) return false;
    }
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.nameVn && item.nameVn.toLowerCase().includes(q)) ||
      (item.equipment && item.equipment.toLowerCase().includes(q))
    );
  }).slice(0, limit);
}
