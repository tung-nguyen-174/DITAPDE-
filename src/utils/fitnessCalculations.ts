import { ExerciseSet, FeedPost, WorkoutExercise, WorkoutSession } from '../types/gym';
import {
  UserBiometrics,
  calculateSetVolume,
  calculateSetE1RM,
  resolveEffectiveWeightKg,
  DEFAULT_USER_BODYWEIGHT_KG,
} from '../engine/workoutExecutionEngine';
import { resolveExerciseMusclesFromJson } from '../services/exerciseImporter';

export {
  calculateSetVolume,
  calculateSetE1RM,
  resolveEffectiveWeightKg,
};

/**
 * Calculates Estimated 1-Rep Max (E1RM) based on set weight and reps.
 * Uses the proven Epley formula: 1RM = weight * (1 + reps / 30).
 * Optionally adjusts for RPE (Rate of Perceived Exertion / Reps In Reserve) when provided.
 */
export function calculateE1RM(weight: number, reps: number, rpe?: number): number {
  if (!weight || weight <= 0 || !reps || reps <= 0) {
    return 0;
  }

  let effectiveReps = reps;
  if (rpe !== undefined && rpe >= 6 && rpe <= 10) {
    const rir = Math.max(0, 10 - rpe);
    effectiveReps = reps + rir;
  }

  if (effectiveReps === 1) {
    return Math.round(weight * 10) / 10;
  }

  const e1rm = weight * (1 + effectiveReps / 30);
  return Math.round(e1rm * 10) / 10;
}

/**
 * Alternative standard E1RM calculation using set weight and reps without RPE adjustments.
 */
export function calculateStandardE1RM(weight: number, reps: number): number {
  if (!weight || weight <= 0 || !reps || reps <= 0) {
    return 0;
  }
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Format E1RM value with unit string.
 */
export function formatE1RM(val: number, unit: string = 'kg'): string {
  if (!val || val <= 0) return `-- ${unit}`;
  return `${val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${unit}`;
}

/**
 * Finds the highest E1RM achieved within a list of sets.
 * Supports optional exercise context and user biometrics for Weighted/Assisted/Bodyweight-only sets.
 */
export function getSetsBestE1RM(
  sets: ExerciseSet[],
  exercise?: Pick<WorkoutExercise, 'name' | 'vietnameseName' | 'exerciseType' | 'bodyweightEngagementFactor'>,
  biometrics?: UserBiometrics
): {
  e1rm: number;
  weight: number;
  reps: number;
  setNumber: number;
  set: ExerciseSet;
} | null {
  if (!sets || sets.length === 0) return null;

  let best = {
    e1rm: 0,
    weight: 0,
    reps: 0,
    setNumber: 1,
    set: sets[0],
  };

  for (const set of sets) {
    const effectiveW = exercise
      ? resolveEffectiveWeightKg(exercise, set, biometrics)
      : set.weight;
    const setE1rm = exercise
      ? calculateSetE1RM(exercise, set, biometrics)
      : calculateE1RM(set.weight, set.reps, set.rpe);

    if (setE1rm > best.e1rm) {
      best = {
        e1rm: setE1rm,
        weight: effectiveW,
        reps: set.reps,
        setNumber: set.setNumber,
        set,
      };
    }
  }

  return best.e1rm > 0 ? best : null;
}

/**
 * Consolidated pure calculation utility (`SetCalculator`) eliminating duplicate
 * inline loops across ActiveLoggerScreen, SummaryScreen, and FeedScreen.
 */
export const SetCalculator = {
  hasAnyCompletedSet(exercises: WorkoutExercise[]): boolean {
    return exercises.some((ex) => ex.sets.some((s) => s.completed));
  },

  calculateSessionTonnage(
    exercises: WorkoutExercise[],
    biometrics?: UserBiometrics,
    options?: { includeUncompletedIfNoneDone?: boolean }
  ): number {
    const hasCompleted = this.hasAnyCompletedSet(exercises);
    const useAll = Boolean(options?.includeUncompletedIfNoneDone && !hasCompleted);

    const total = exercises.reduce((acc, ex) => {
      const activeSets = useAll ? ex.sets : ex.sets.filter((s) => s.completed);
      const exVolume = activeSets.reduce(
        (sum, s) => sum + calculateSetVolume(ex, s, biometrics),
        0
      );
      return acc + exVolume;
    }, 0);

    return Number(total.toFixed(1));
  },

  calculateCompletedSetsCount(
    exercises: WorkoutExercise[],
    options?: { includeUncompletedIfNoneDone?: boolean }
  ): number {
    const hasCompleted = this.hasAnyCompletedSet(exercises);
    const useAll = Boolean(options?.includeUncompletedIfNoneDone && !hasCompleted);

    return exercises.reduce(
      (acc, ex) => acc + (useAll ? ex.sets.length : ex.sets.filter((s) => s.completed).length),
      0
    );
  },

  findSessionTopPR(
    session: Pick<WorkoutSession, 'exercises' | 'prAchieved' | 'userBodyweightKg' | 'preferredUnit'>,
    options?: { includeUncompletedIfNoneDone?: boolean }
  ): {
    exerciseName: string;
    weight: number;
    reps: number;
    rpe: number;
    e1rm: number;
  } {
    const hasCompleted = this.hasAnyCompletedSet(session.exercises);
    const useAll = Boolean(options?.includeUncompletedIfNoneDone && !hasCompleted);
    const biometrics: UserBiometrics = {
      bodyweightKg: session.userBodyweightKg ?? DEFAULT_USER_BODYWEIGHT_KG,
      preferredUnit: session.preferredUnit ?? 'kg',
    };

    let bestCandidate: {
      exerciseName: string;
      weight: number;
      reps: number;
      rpe: number;
      e1rm: number;
    } | null = null;

    for (const ex of session.exercises) {
      const setsToInspect = useAll ? ex.sets : ex.sets.filter((s) => s.completed);
      for (const s of setsToInspect) {
        if (s.reps <= 0) continue;
        const effWeight = resolveEffectiveWeightKg(ex, s, biometrics);
        if (effWeight <= 0) continue;
        const e1rm = calculateSetE1RM(ex, s, biometrics, { includeRirFromRpe: true });
        if (!bestCandidate || e1rm > bestCandidate.e1rm) {
          bestCandidate = {
            exerciseName: ex.name,
            weight: effWeight,
            reps: s.reps,
            rpe: s.rpe || 8.5,
            e1rm,
          };
        }
      }
    }

    const fallbackName = session.exercises[0]?.name || 'Barbell Bench Press';
    return {
      exerciseName: session.prAchieved?.exerciseName || bestCandidate?.exerciseName || fallbackName,
      weight: session.prAchieved?.weight || bestCandidate?.weight || 120,
      reps: session.prAchieved?.reps || bestCandidate?.reps || 5,
      rpe: bestCandidate?.rpe || 9,
      e1rm: session.prAchieved?.e1rm || bestCandidate?.e1rm || calculateE1RM(120, 5, 9),
    };
  },

  buildMacroMuscleVolumes(
    exercises: WorkoutExercise[],
    options?: { includeUncompletedIfNoneDone?: boolean }
  ): Record<'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Core' | 'Legs', number> {
    const hasCompleted = this.hasAnyCompletedSet(exercises);
    const useAll = Boolean(options?.includeUncompletedIfNoneDone && !hasCompleted);
    const displayVolumes = {
      Chest: 0,
      Back: 0,
      Shoulders: 0,
      Arms: 0,
      Core: 0,
      Legs: 0,
    };

    for (const ex of exercises) {
      const done = useAll ? ex.sets.length : ex.sets.filter((s) => s.completed).length;
      if (done <= 0) continue;

      const { primaryMuscles } = resolveExerciseMusclesFromJson(
        ex.name,
        ex.primaryMuscle,
        ex.secondaryMuscles
      );
      for (const primary of primaryMuscles) {
        if (primary === 'chest') displayVolumes.Chest += done;
        else if (
          primary === 'lats' ||
          primary === 'upper_back' ||
          primary === 'traps'
        ) {
          displayVolumes.Back += done;
        } else if (
          primary === 'front_delts' ||
          primary === 'side_delts' ||
          primary === 'rear_delts' ||
          primary === 'neck'
        ) {
          displayVolumes.Shoulders += done;
        } else if (
          primary === 'biceps' ||
          primary === 'triceps' ||
          primary === 'forearms'
        ) {
          displayVolumes.Arms += done;
        } else if (primary === 'abs' || primary === 'lower_back') {
          displayVolumes.Core += done;
        } else if (
          primary === 'quads' ||
          primary === 'adductors' ||
          primary === 'abductors' ||
          primary === 'hamstrings' ||
          primary === 'glutes' ||
          primary === 'calves'
        ) {
          displayVolumes.Legs += done;
        }
      }
    }

    return displayVolumes;
  },
};

/**
 * Consolidated `TelemetryParser` utility for formatting timers and parsing post telemetry overlays.
 */
export const TelemetryParser = {
  formatStopwatch(totalSeconds: number): string {
    const clamped = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(clamped / 3600);
    const mins = Math.floor((clamped % 3600) / 60);
    const secs = clamped % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  },

  extractPostTelemetryOverlay(post: Pick<FeedPost, 'workoutSummary' | 'totalTonnageKg' | 'media'>) {
    if (post.media?.telemetryData) {
      return post.media.telemetryData;
    }
    const topEx = post.workoutSummary.exercises[0];
    const rpeMatch = topEx?.topSet?.match(/RPE\s*([\d.]+)/i);
    const parsedRpe = rpeMatch ? parseFloat(rpeMatch[1]) : 9.0;
    const cleanTopSet = topEx?.topSet
      ? topEx.topSet.replace(/\s*\(RPE[^)]*\)/i, '').replace(/x/i, '×')
      : '120 kg × 5 lần';

    return {
      exercise: topEx?.name || 'Barbell Bench Press',
      weightReps: cleanTopSet,
      rpe: parsedRpe,
      volume: `${post.totalTonnageKg.toLocaleString()} kg`,
    };
  },
};

/**
 * Extracts strength progression and best E1RM for all exercises in a session,
 * accounting for Bodyweight, Weighted Bodyweight, and Assisted Bodyweight exercises.
 */
export function getSessionExerciseProgressions(session: WorkoutSession) {
  const hasAnyCompleted = SetCalculator.hasAnyCompletedSet(session.exercises);
  const biometrics: UserBiometrics = {
    bodyweightKg: session.userBodyweightKg ?? DEFAULT_USER_BODYWEIGHT_KG,
    preferredUnit: session.preferredUnit ?? 'kg',
  };

  return session.exercises.map((exercise) => {
    const activeSets = hasAnyCompleted
      ? exercise.sets.filter((s) => s.completed)
      : exercise.sets;
    const validSets = activeSets.filter(
      (s) => s.reps > 0 && resolveEffectiveWeightKg(exercise, s, biometrics) > 0
    );
    const bestSetInfo = getSetsBestE1RM(validSets, exercise, biometrics);
    const totalVolume = activeSets.reduce(
      (sum, s) => sum + calculateSetVolume(exercise, s, biometrics),
      0
    );

    return {
      exerciseId: exercise.id,
      name: exercise.name,
      vietnameseName: exercise.vietnameseName,
      primaryMuscle: exercise.primaryMuscle,
      setsCount: exercise.sets.length,
      completedSetsCount: exercise.sets.filter((s) => s.completed).length,
      bestE1rm: bestSetInfo ? bestSetInfo.e1rm : 0,
      bestSet: bestSetInfo ? bestSetInfo.set : null,
      totalVolume: Number(totalVolume.toFixed(1)),
    };
  });
}

export const PLATE_CODE_COLORS = {
  green: '#4CAF6D', // low / RPE 1-4
  yellow: '#E0B93D', // moderate / RPE 5-6
  blue: '#3E8EDE', // heavy / RPE 7-8
  red: '#E4483C', // max effort / RPE 9-10 / PR
} as const;

export type CompoundLiftKey = 'bench_press' | 'back_squat' | 'deadlift' | 'overhead_press';

export interface CompoundLiftDefinition {
  key: CompoundLiftKey;
  name: string;
  shortName: string;
  vietnameseName: string;
  icon: string;
  color: string;
  isTopThreeSBD: boolean;
  defaultExerciseName: string;
  primaryMuscle: WorkoutExercise['primaryMuscle'];
  keywords: string[];
}

export const COMPOUND_LIFT_DEFINITIONS: CompoundLiftDefinition[] = [
  {
    key: 'bench_press',
    name: 'Bench Press',
    shortName: 'Bench',
    vietnameseName: 'Đẩy ngực ngang',
    icon: '🏋️‍♂️',
    color: PLATE_CODE_COLORS.red,
    isTopThreeSBD: true,
    defaultExerciseName: 'Barbell Bench Press',
    primaryMuscle: 'chest',
    keywords: [
      'bench press',
      'barbell bench press',
      'dumbbell bench press',
      'incline bench press',
      'đẩy ngực ngang',
      'đẩy ngực',
    ],
  },
  {
    key: 'back_squat',
    name: 'Back Squat',
    shortName: 'Squat',
    vietnameseName: 'Gánh tạ đòn',
    icon: '🦵',
    color: PLATE_CODE_COLORS.blue,
    isTopThreeSBD: true,
    defaultExerciseName: 'Barbell Back Squat',
    primaryMuscle: 'quads',
    keywords: [
      'back squat',
      'barbell back squat',
      'barbell squat',
      'front squat',
      'squat',
      'gánh tạ',
      'gánh đùi',
    ],
  },
  {
    key: 'deadlift',
    name: 'Deadlift',
    shortName: 'Deadlift',
    vietnameseName: 'Kéo tạ đòn',
    icon: '⚡',
    color: PLATE_CODE_COLORS.yellow,
    isTopThreeSBD: true,
    defaultExerciseName: 'Barbell Deadlift',
    primaryMuscle: 'lower_back',
    keywords: [
      'deadlift',
      'barbell deadlift',
      'conventional deadlift',
      'sumo deadlift',
      'romanian deadlift',
      'kéo tạ',
      'kéo lưng',
    ],
  },
  {
    key: 'overhead_press',
    name: 'Overhead Press',
    shortName: 'OHP',
    vietnameseName: 'Đẩy vai đứng',
    icon: '🥇',
    color: PLATE_CODE_COLORS.green,
    isTopThreeSBD: false,
    defaultExerciseName: 'Overhead Barbell Press',
    primaryMuscle: 'front_delts',
    keywords: [
      'overhead press',
      'overhead barbell press',
      'military press',
      'shoulder press',
      'đẩy vai',
    ],
  },
];

export interface CompoundLiftSessionResult {
  key: CompoundLiftKey;
  name: string;
  shortName: string;
  vietnameseName: string;
  icon: string;
  color: string;
  isTopThreeSBD: boolean;
  hasSessionSet: boolean;
  matchedExerciseName: string;
  heaviestWeightKg: number;
  reps: number;
  rpe?: number;
  setNumber: number;
  isCompleted: boolean;
  e1rmKg: number;
}

/**
 * Calculates Estimated 1RM (E1RM) for the core compound lifts (Bench, Squat, Deadlift, OHP)
 * based on the current session's heaviest set for each lift.
 */
export function calculateCompoundLiftsE1RM(
  exercises: WorkoutExercise[],
  biometrics?: UserBiometrics
): CompoundLiftSessionResult[] {
  const bio: UserBiometrics = {
    bodyweightKg: biometrics?.bodyweightKg ?? DEFAULT_USER_BODYWEIGHT_KG,
    preferredUnit: biometrics?.preferredUnit ?? 'kg',
  };

  return COMPOUND_LIFT_DEFINITIONS.map((def) => {
    const matchingExercises = exercises.filter((ex) => {
      const text = `${ex.name} ${ex.vietnameseName || ''}`.toLowerCase();
      return def.keywords.some((kw) => text.includes(kw));
    });

    const hasCompletedInLift = matchingExercises.some((ex) =>
      ex.sets.some((s) => s.completed && s.reps > 0 && resolveEffectiveWeightKg(ex, s, bio) > 0)
    );

    let bestCandidate: {
      exerciseName: string;
      weightKg: number;
      reps: number;
      rpe?: number;
      setNumber: number;
      isCompleted: boolean;
      e1rmKg: number;
    } | null = null;

    for (const ex of matchingExercises) {
      const candidateSets = hasCompletedInLift
        ? ex.sets.filter((s) => s.completed)
        : ex.sets;

      for (const s of candidateSets) {
        if (!s || s.reps <= 0) continue;
        const effWeight = resolveEffectiveWeightKg(ex, s, bio);
        if (effWeight <= 0) continue;
        const e1rm = calculateSetE1RM(ex, s, bio, { includeRirFromRpe: true });

        // Select based on the session's heaviest set (breaking ties by higher E1RM)
        if (
          !bestCandidate ||
          effWeight > bestCandidate.weightKg ||
          (effWeight === bestCandidate.weightKg && e1rm > bestCandidate.e1rmKg)
        ) {
          bestCandidate = {
            exerciseName: ex.name,
            weightKg: effWeight,
            reps: s.reps,
            rpe: s.rpe,
            setNumber: s.setNumber,
            isCompleted: Boolean(s.completed),
            e1rmKg: e1rm,
          };
        }
      }
    }

    return {
      key: def.key,
      name: def.name,
      shortName: def.shortName,
      vietnameseName: def.vietnameseName,
      icon: def.icon,
      color: def.color,
      isTopThreeSBD: def.isTopThreeSBD,
      hasSessionSet: Boolean(bestCandidate && bestCandidate.e1rmKg > 0),
      matchedExerciseName: bestCandidate?.exerciseName || def.defaultExerciseName,
      heaviestWeightKg: bestCandidate?.weightKg || 0,
      reps: bestCandidate?.reps || 0,
      rpe: bestCandidate?.rpe,
      setNumber: bestCandidate?.setNumber || 1,
      isCompleted: bestCandidate?.isCompleted ?? false,
      e1rmKg: bestCandidate?.e1rmKg || 0,
    };
  });
}

export function getRpePlateColor(rpe: number): string {
  if (rpe >= 9) return PLATE_CODE_COLORS.red;
  if (rpe >= 7) return PLATE_CODE_COLORS.blue;
  if (rpe >= 5) return PLATE_CODE_COLORS.yellow;
  return PLATE_CODE_COLORS.green;
}

export function getRpePlateLabel(rpe: number): string {
  if (rpe >= 9) return 'Tối đa';
  if (rpe >= 7) return 'Nặng';
  if (rpe >= 5) return 'Vừa';
  return 'Nhẹ';
}

export const HEATMAP_VOLUME_COLORS = {
  inactive: '#334155', // 0 Sets: Slate-700 / Inactive
  light: '#FBBF24',    // 1-3 Sets: Amber-400 / Light Activation
  moderate: '#FB923C', // 4-6 Sets: Orange-400 / Moderate Fatigue
  peak: '#EF4444',     // 7+ Sets: Red-500 / High Fatigue / Aura Peak
} as const;

export function getVolumePlateColor(sets: number): string {
  if (!sets || sets <= 0) return HEATMAP_VOLUME_COLORS.inactive; // #334155
  if (sets <= 3) return HEATMAP_VOLUME_COLORS.light;             // #FBBF24
  if (sets <= 6) return HEATMAP_VOLUME_COLORS.moderate;          // #FB923C
  return HEATMAP_VOLUME_COLORS.peak;                             // #EF4444
}
