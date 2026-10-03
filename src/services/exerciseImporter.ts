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

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Ngực (Chest)',
  front_delts: 'Vai trước (Front Delts)',
  side_delts: 'Vai giữa (Side Delts)',
  rear_delts: 'Vai sau (Rear Delts)',
  triceps: 'Tay sau (Triceps)',
  biceps: 'Tay trước (Biceps)',
  forearms: 'Cẳng tay (Forearms)',
  lats: 'Xô (Lats)',
  traps: 'Cầu vai (Traps)',
  upper_back: 'Lưng trên (Upper Back)',
  lower_back: 'Lưng dưới (Lower Back)',
  neck: 'Cổ (Neck)',
  abs: 'Bụng (Abs)',
  quads: 'Đùi trước (Quads)',
  adductors: 'Đùi trong (Inner Thigh)',
  abductors: 'Đùi trong & Hông (Inner/Outer Thigh)',
  hamstrings: 'Đùi sau (Hamstrings)',
  glutes: 'Mông (Glutes)',
  calves: 'Bắp chân (Calves)',
};

export function getMuscleGroupLabel(
  group: MuscleGroup,
  rawMuscleName?: string
): string {
  if (rawMuscleName) {
    const cleanRaw = rawMuscleName.toLowerCase().trim();
    if (cleanRaw === 'middle chest' || cleanRaw === 'middle_chest') {
      return 'Ngực giữa (Middle Chest)';
    }
    if (cleanRaw === 'upper chest' || cleanRaw === 'upper_chest') {
      return 'Ngực trên (Upper Chest)';
    }
    if (cleanRaw === 'lower chest' || cleanRaw === 'lower_chest') {
      return 'Ngực dưới (Lower Chest)';
    }
  }
  return MUSCLE_GROUP_LABELS[group] || group;
}

export function matchesMuscleCategoryFilter(
  group: MuscleGroup,
  category: string
): boolean {
  if (!category || category === 'Tất cả') return true;
  if (category === 'Ngực') return group === 'chest';
  if (category === 'Lưng') {
    return ['lats', 'upper_back', 'lower_back', 'traps'].includes(group);
  }
  if (category === 'Vai') {
    return ['front_delts', 'side_delts', 'rear_delts', 'neck'].includes(group);
  }
  if (category === 'Tay') {
    return ['biceps', 'triceps', 'forearms'].includes(group);
  }
  if (category === 'Chân') {
    return ['quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'].includes(
      group
    );
  }
  if (category === 'Bụng') return group === 'abs';
  return true;
}

function inferShoulderSubGroup(exerciseName?: unknown): MuscleGroup {
  if (typeof exerciseName !== 'string' || !exerciseName.trim()) return 'front_delts';
  const lower = exerciseName.toLowerCase();
  if (
    lower.includes('rear') ||
    lower.includes('reverse fly') ||
    lower.includes('back fly') ||
    lower.includes('pull apart') ||
    lower.includes('face pull') ||
    lower.includes('external rotation')
  ) {
    return 'rear_delts';
  }
  if (
    lower.includes('lateral') ||
    lower.includes('side') ||
    lower.includes('upright row') ||
    lower.includes('crucifix') ||
    lower.includes('iron cross') ||
    lower.includes('around the world') ||
    lower.includes('scaption')
  ) {
    return 'side_delts';
  }
  return 'front_delts';
}

export function mapStringToMuscleGroup(
  rawMuscle: string,
  exerciseName?: unknown
): MuscleGroup {
  const clean = (typeof rawMuscle === 'string' ? rawMuscle : '')
    .toLowerCase()
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  const lowerName = typeof exerciseName === 'string' ? exerciseName.toLowerCase().trim() : '';

  // Explicit anatomical override for inner/outer thigh exercises
  if (
    lowerName.includes('adductor') ||
    lowerName.includes('adduction') ||
    lowerName.includes('groin') ||
    lowerName.includes('inner thigh')
  ) {
    return 'adductors';
  }
  if (
    lowerName.includes('abductor') ||
    lowerName.includes('abduction') ||
    lowerName.includes('outer thigh') ||
    lowerName.includes('iliotibial') ||
    lowerName.includes('it band') ||
    lowerName.includes('monster walk')
  ) {
    return 'abductors';
  }

  switch (clean) {
    case 'chest':
    case 'middle_chest':
    case 'upper_chest':
    case 'lower_chest':
    case 'pectoralis':
    case 'pectorals':
      return 'chest';
    case 'lats':
    case 'latissimus_dorsi':
      return 'lats';
    case 'traps':
    case 'trapezius':
      return 'traps';
    case 'neck':
      return 'neck';
    case 'upper_back':
    case 'middle_back':
    case 'rhomboids':
      return 'upper_back';
    case 'lower_back':
    case 'erector_spinae':
      return 'lower_back';
    case 'quads':
    case 'quadriceps':
      return 'quads';
    case 'adductors':
    case 'adductor':
    case 'inner_thigh':
    case 'inner_thighs':
    case 'groin':
      return 'adductors';
    case 'abductors':
    case 'abductor':
    case 'outer_thigh':
    case 'outer_thighs':
    case 'hip_abductors':
      return 'abductors';
    case 'hamstrings':
    case 'hamstring':
      return 'hamstrings';
    case 'gluteus_maximus':
    case 'gluteus_medius':
    case 'glutes':
    case 'glute':
      return 'glutes';
    case 'calves':
    case 'calf':
    case 'gastrocnemius':
    case 'soleus':
      return 'calves';
    case 'front_delts':
    case 'anterior_deltoid':
      return 'front_delts';
    case 'side_delts':
    case 'lateral_deltoid':
      return 'side_delts';
    case 'rear_delts':
    case 'posterior_deltoid':
      return 'rear_delts';
    case 'shoulders':
    case 'shoulder':
    case 'delts':
    case 'deltoids':
      return inferShoulderSubGroup(lowerName);
    case 'biceps':
    case 'biceps_brachii':
    case 'brachialis':
      return 'biceps';
    case 'forearms':
    case 'forearm':
    case 'brachioradialis':
    case 'wrist':
      return 'forearms';
    case 'triceps':
    case 'triceps_brachii':
      return 'triceps';
    case 'abs':
    case 'abdominals':
    case 'obliques':
    case 'core':
      return 'abs';
    default: {
      // Fallback inference from exercise name if an unknown string was provided
      const text = `${clean} ${lowerName}`;
      if (text.includes('adduct') || text.includes('groin') || text.includes('inner')) return 'adductors';
      if (text.includes('abduct') || text.includes('outer') || text.includes('monster_walk') || text.includes('iliotibial')) return 'abductors';
      if (text.includes('squat') || text.includes('lunge') || text.includes('quad') || text.includes('leg_extension') || text.includes('leg_press')) return 'quads';
      if (text.includes('hamstring') || text.includes('leg_curl') || text.includes('rdl') || text.includes('romanian')) return 'hamstrings';
      if (text.includes('glute') || text.includes('hip_thrust') || text.includes('bridge')) return 'glutes';
      if (text.includes('calf') || text.includes('calves')) return 'calves';
      if (text.includes('deadlift') || text.includes('hyperextension') || text.includes('good_morning')) return 'lower_back';
      if (text.includes('shrug') || text.includes('trap')) return 'traps';
      if (text.includes('neck')) return 'neck';
      if (text.includes('pull') || text.includes('lat') || text.includes('chin')) return 'lats';
      if (text.includes('row') || text.includes('back')) return 'upper_back';
      if (text.includes('wrist') || text.includes('forearm')) return 'forearms';
      if (text.includes('bicep') || text.includes('curl')) return 'biceps';
      if (text.includes('tricep') || text.includes('pushdown') || text.includes('skullcrusher') || text.includes('dip')) return 'triceps';
      if (text.includes('shoulder') || text.includes('delt') || text.includes('overhead') || text.includes('military')) {
        return inferShoulderSubGroup(lowerName);
      }
      if (text.includes('ab') || text.includes('crunch') || text.includes('plank') || text.includes('sit_up')) return 'abs';
      return 'chest';
    }
  }
}

export const ALL_RAW_EXERCISES: RawExerciseItem[] = (exercisesData as any).exercises || [];

const RAW_EXERCISE_LOOKUP_MAP: Map<string, RawExerciseItem> = new Map(
  ALL_RAW_EXERCISES.map((item) => [item.name.toLowerCase().trim(), item])
);

/**
 * Resolves primary & secondary MuscleGroups for an exercise by cross-referencing
 * `src/assets/data/exercises.json` (`ALL_RAW_EXERCISES`) first, then intelligent
 * exercise name matching, falling back to the exercise object's own muscles.
 */
export function resolveExerciseMusclesFromJson(
  exerciseName: string,
  fallbackPrimary?: MuscleGroup,
  fallbackSecondary?: MuscleGroup[]
): { primaryMuscles: MuscleGroup[]; secondaryMuscles: MuscleGroup[] } {
  const cleanName = (exerciseName || '').toLowerCase().trim();
  let matched = RAW_EXERCISE_LOOKUP_MAP.get(cleanName);

  // Also check without parenthetical suffixes e.g. "Romanian Deadlift (RDL)" -> "romanian deadlift"
  if (!matched && cleanName.includes('(')) {
    const stripped = cleanName.replace(/\s*\([^)]*\)/g, '').trim();
    matched = RAW_EXERCISE_LOOKUP_MAP.get(stripped);
  }

  if (matched && matched.primaryMuscles && matched.primaryMuscles.length > 0) {
    const primaryMuscles = Array.from(
      new Set(matched.primaryMuscles.map((m) => mapStringToMuscleGroup(m, matched!.name)))
    );
    const secondaryMuscles = Array.from(
      new Set((matched.secondaryMuscles || []).map((m) => mapStringToMuscleGroup(m, matched!.name)))
    );

    if (
      matched.primaryMuscles.some((m) => m.toLowerCase().trim() === 'shoulders') &&
      primaryMuscles.includes('front_delts') &&
      !secondaryMuscles.includes('side_delts')
    ) {
      secondaryMuscles.push('side_delts');
    }

    // Ensure adductor/abductor exercises activate inner thigh ('adductors') on the heatmap
    if (primaryMuscles.includes('abductors') && !secondaryMuscles.includes('adductors')) {
      secondaryMuscles.push('adductors');
    }

    return { primaryMuscles, secondaryMuscles };
  }

  // Intelligent biomechanical fallback for common compound/isolation aliases
  if (cleanName.includes('adductor') || cleanName.includes('groin') || cleanName.includes('inner thigh')) {
    return { primaryMuscles: ['adductors'], secondaryMuscles: ['glutes'] };
  }
  if (cleanName.includes('abductor') || cleanName.includes('outer thigh')) {
    return { primaryMuscles: ['abductors', 'adductors'], secondaryMuscles: ['glutes'] };
  }
  if (cleanName.includes('hip thrust') || cleanName.includes('glute bridge')) {
    return { primaryMuscles: ['glutes'], secondaryMuscles: ['hamstrings', 'quads'] };
  }
  if (cleanName.includes('romanian deadlift') || cleanName.includes('rdl') || cleanName.includes('stiff-leg')) {
    return { primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes', 'lower_back'] };
  }
  if (cleanName.includes('deadlift')) {
    return { primaryMuscles: ['lower_back', 'hamstrings'], secondaryMuscles: ['glutes', 'quads', 'traps', 'forearms'] };
  }
  if (cleanName.includes('squat') || cleanName.includes('lunge') || cleanName.includes('leg press')) {
    return { primaryMuscles: ['quads'], secondaryMuscles: ['glutes', 'hamstrings', 'adductors', 'calves'] };
  }
  if (cleanName.includes('bench press') || cleanName.includes('dumbbell press') || cleanName.includes('chest press')) {
    return { primaryMuscles: ['chest'], secondaryMuscles: ['front_delts', 'triceps'] };
  }
  if (cleanName.includes('pec deck') || cleanName.includes('butterfly') || cleanName.includes('chest fly')) {
    return { primaryMuscles: ['chest'], secondaryMuscles: ['front_delts'] };
  }
  if (cleanName.includes('dip')) {
    return { primaryMuscles: ['chest', 'triceps'], secondaryMuscles: ['front_delts'] };
  }
  if (cleanName.includes('overhead') || cleanName.includes('shoulder press') || cleanName.includes('military press')) {
    return { primaryMuscles: ['front_delts'], secondaryMuscles: ['side_delts', 'triceps', 'traps'] };
  }
  if (cleanName.includes('lateral raise') || cleanName.includes('side lateral')) {
    return { primaryMuscles: ['side_delts'], secondaryMuscles: ['front_delts', 'traps'] };
  }
  if (cleanName.includes('rear delt') || cleanName.includes('face pull') || cleanName.includes('reverse fly')) {
    return { primaryMuscles: ['rear_delts'], secondaryMuscles: ['upper_back', 'traps'] };
  }
  if (cleanName.includes('pull-up') || cleanName.includes('pullup') || cleanName.includes('chin-up') || cleanName.includes('lat pulldown')) {
    return { primaryMuscles: ['lats'], secondaryMuscles: ['biceps', 'upper_back', 'forearms'] };
  }
  if (cleanName.includes('row')) {
    return { primaryMuscles: ['upper_back', 'lats'], secondaryMuscles: ['biceps', 'rear_delts', 'lower_back', 'forearms'] };
  }
  if (cleanName.includes('shrug')) {
    return { primaryMuscles: ['traps'], secondaryMuscles: ['upper_back', 'forearms'] };
  }
  if (cleanName.includes('wrist') || cleanName.includes('forearm') || cleanName.includes('farmer')) {
    return { primaryMuscles: ['forearms'], secondaryMuscles: ['biceps'] };
  }
  if (cleanName.includes('bicep') || cleanName.includes('curl')) {
    if (cleanName.includes('leg') || cleanName.includes('hamstring')) {
      return { primaryMuscles: ['hamstrings'], secondaryMuscles: ['calves'] };
    }
    return { primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'] };
  }
  if (cleanName.includes('tricep') || cleanName.includes('pushdown') || cleanName.includes('skullcrusher')) {
    return { primaryMuscles: ['triceps'], secondaryMuscles: [] };
  }
  if (cleanName.includes('calf')) {
    return { primaryMuscles: ['calves'], secondaryMuscles: [] };
  }

  return {
    primaryMuscles: fallbackPrimary
      ? [mapStringToMuscleGroup(fallbackPrimary, exerciseName)]
      : [mapStringToMuscleGroup('', exerciseName)],
    secondaryMuscles: fallbackSecondary || [],
  };
}

/**
 * Builds a canonical `Map<MuscleGroup, int>` (`Partial<Record<MuscleGroup, number>>`)
 * from a list of `WorkoutExercise` items aligned with `exercises.json`.
 */
export function buildSetVolumeMapFromExercisesJson(
  exercises: WorkoutExercise[],
  options?: { includeUncompletedIfNoneDone?: boolean }
): Partial<Record<MuscleGroup, number>> {
  const hasAnyCompleted = exercises.some((ex) => ex.sets.some((s) => s.completed));
  const useAllSets = Boolean(options?.includeUncompletedIfNoneDone && !hasAnyCompleted);

  const rawAccumulator: Partial<Record<MuscleGroup, number>> = {};

  exercises.forEach((ex) => {
    const workingSetCount = useAllSets
      ? ex.sets.length
      : ex.sets.filter((s) => s.completed).length;

    if (workingSetCount <= 0) return;

    const { primaryMuscles, secondaryMuscles } = resolveExerciseMusclesFromJson(
      ex.name,
      ex.primaryMuscle,
      ex.secondaryMuscles
    );

    primaryMuscles.forEach((m) => {
      rawAccumulator[m] = (rawAccumulator[m] || 0) + workingSetCount;
      // Mirror inner/outer thigh abductors/adductors so inner thigh always lights up on the heatmap
      if (m === 'abductors') {
        rawAccumulator.adductors = Math.max(
          rawAccumulator.adductors || 0,
          (rawAccumulator.adductors || 0) + workingSetCount
        );
      }
      if (m === 'traps') {
        rawAccumulator.upper_back = (rawAccumulator.upper_back || 0) + workingSetCount * 0.5;
      }
    });

    secondaryMuscles.forEach((sec) => {
      rawAccumulator[sec] = (rawAccumulator[sec] || 0) + workingSetCount * 0.5;
    });
  });

  const roundedMap: Partial<Record<MuscleGroup, number>> = {};
  (Object.keys(rawAccumulator) as MuscleGroup[]).forEach((k) => {
    roundedMap[k] = Math.round(rawAccumulator[k] || 0);
  });

  return roundedMap;
}

export function searchExerciseCatalog(
  keyword: string,
  filterMuscle?: MuscleGroup,
  limit = 30
): RawExerciseItem[] {
  const q = keyword.toLowerCase().trim();
  return ALL_RAW_EXERCISES.filter((item) => {
    if (filterMuscle) {
      const match = item.primaryMuscles?.some(
        (m) => mapStringToMuscleGroup(m, item.name) === filterMuscle
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

