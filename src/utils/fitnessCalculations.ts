import { ExerciseSet, WorkoutExercise, WorkoutSession } from '../types/gym';
import {
  UserBiometrics,
  calculateSetVolume,
  calculateSetE1RM,
  resolveEffectiveWeightKg,
  DEFAULT_USER_BODYWEIGHT_KG,
} from '../engine/workoutExecutionEngine';

export {
  calculateSetVolume,
  calculateSetE1RM,
  resolveEffectiveWeightKg,
};

/**
 * Calculates Estimated 1-Rep Max (E1RM) based on set weight and reps.
 * Uses the proven Epley formula: 1RM = weight * (1 + reps / 30).
 * Optionally adjusts for RPE (Rate of Perceived Exertion / Reps In Reserve) when provided.
 *
 * @param weight - The weight lifted in kg (or lbs)
 * @param reps - The number of repetitions completed
 * @param rpe - Optional RPE (6-10 scale), where (10 - rpe) is Reps In Reserve (RIR)
 * @returns The estimated 1-Rep Max rounded to 1 decimal place, or 0 if inputs are invalid.
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
 * Extracts strength progression and best E1RM for all exercises in a session,
 * accounting for Bodyweight, Weighted Bodyweight, and Assisted Bodyweight exercises.
 */
export function getSessionExerciseProgressions(session: WorkoutSession) {
  const hasAnyCompleted = session.exercises.some((ex) => ex.sets.some((s) => s.completed));
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

export function getVolumePlateColor(sets: number): string {
  if (sets <= 0) return '#28272E'; // Surface-raised when inactive
  if (sets <= 3) return PLATE_CODE_COLORS.green;
  if (sets <= 5) return PLATE_CODE_COLORS.yellow;
  if (sets <= 8) return PLATE_CODE_COLORS.blue;
  return PLATE_CODE_COLORS.red;
}

