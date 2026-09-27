import { MuscleGroup } from '../types/gym';
import { WeightUnit } from './unitConverter';

/**
 * Core Exercise Biomechanical Classification for Task 1.
 */
export type ExerciseType =
  | 'BARBELL_DUMBBELL_CABLE'
  | 'WEIGHTED_BODYWEIGHT'
  | 'ASSISTED_BODYWEIGHT'
  | 'BODYWEIGHT_ONLY';

/**
 * User biometric context required for bodyweight & modified bodyweight calculations.
 */
export interface UserBiometrics {
  /**
   * Canonical user bodyweight in kilograms (`base_weight_kg`).
   * If missing, zero, or negative, the engine safely falls back to `DEFAULT_USER_BODYWEIGHT_KG` (70 kg)
   * unless `allowZeroBodyweightFallback` is specified.
   */
  bodyweightKg?: number | null;
  preferredUnit?: WeightUnit;
}

/**
 * Canonical Workout Set data model supporting standard external load,
 * weighted bodyweight (+kg), assisted bodyweight (-kg), and pure bodyweight (BW * alpha).
 */
export interface WorkoutSetModel {
  id: string;
  setNumber: number;
  setType: 'W' | 'N' | 'D' | 'F';
  /**
   * Canonical external weight in kilograms (`base_weight_kg`).
   * - For `BARBELL_DUMBBELL_CABLE`: the lifted barbell/dumbbell/cable load in kg.
   * - For `WEIGHTED_BODYWEIGHT`: external added load (`added_weight`) in kg if `addedWeightKg` is not separately set.
   * - For `ASSISTED_BODYWEIGHT`: counterweight/band assistance (`assisted_weight`) in kg if `assistedWeightKg` is not separately set.
   * - For `BODYWEIGHT_ONLY`: ignored (0).
   */
  weight: number;
  baseWeightKg?: number;
  addedWeightKg?: number;
  assistedWeightKg?: number;
  reps: number;
  rpe?: number;
  completed: boolean;
}

/**
 * Canonical Exercise model with biomechanical classification and engagement factor.
 */
export interface ExerciseModel {
  id: string;
  name: string;
  vietnameseName?: string;
  primaryMuscle?: MuscleGroup;
  exerciseType?: ExerciseType;
  /**
   * Bodyweight Engagement Factor (alpha) in [0.1, 1.0] used when `exerciseType === 'BODYWEIGHT_ONLY'`.
   * Examples: Push-up = 0.64, Pull-up / Chin-up / Dip = 1.0, Bodyweight Squat = 0.75.
   */
  bodyweightEngagementFactor?: number;
  supersetGroupId?: string;
}

export const DEFAULT_USER_BODYWEIGHT_KG = 70;

export const BODYWEIGHT_ENGAGEMENT_FACTORS: Record<string, number> = {
  push_up: 0.64,
  pull_up: 1.0,
  chin_up: 1.0,
  dip: 1.0,
  muscle_up: 1.0,
  squat: 0.75,
  lunge: 0.75,
  pistol_squat: 0.85,
  crunch: 0.4,
  sit_up: 0.45,
  leg_raise: 0.5,
  default: 0.7,
};

/**
 * Infers the biomechanical engagement factor (alpha) for a `BODYWEIGHT_ONLY` exercise
 * based on its explicit `bodyweightEngagementFactor` or exercise name.
 */
export function resolveBodyweightEngagementFactor(
  exercise?: Pick<ExerciseModel, 'name' | 'vietnameseName' | 'bodyweightEngagementFactor'> | null
): number {
  if (
    exercise?.bodyweightEngagementFactor !== undefined &&
    !Number.isNaN(exercise.bodyweightEngagementFactor) &&
    exercise.bodyweightEngagementFactor > 0
  ) {
    return Math.min(1.5, Math.max(0.05, exercise.bodyweightEngagementFactor));
  }

  const combinedName = `${exercise?.name || ''} ${exercise?.vietnameseName || ''}`.toLowerCase();

  if (
    combinedName.includes('push-up') ||
    combinedName.includes('push up') ||
    combinedName.includes('pushup') ||
    combinedName.includes('hít đất') ||
    combinedName.includes('chống đẩy')
  ) {
    return BODYWEIGHT_ENGAGEMENT_FACTORS.push_up; // 0.64
  }

  if (
    combinedName.includes('pull-up') ||
    combinedName.includes('pull up') ||
    combinedName.includes('pullup') ||
    combinedName.includes('chin-up') ||
    combinedName.includes('chin up') ||
    combinedName.includes('kéo xà') ||
    combinedName.includes('xà đơn') ||
    combinedName.includes('dip') ||
    combinedName.includes('xà kép')
  ) {
    return BODYWEIGHT_ENGAGEMENT_FACTORS.pull_up; // 1.0
  }

  if (combinedName.includes('pistol')) {
    return BODYWEIGHT_ENGAGEMENT_FACTORS.pistol_squat; // 0.85
  }

  if (
    combinedName.includes('squat') ||
    combinedName.includes('lunge') ||
    combinedName.includes('gánh đùi') ||
    combinedName.includes('chùng chân')
  ) {
    return BODYWEIGHT_ENGAGEMENT_FACTORS.squat; // 0.75
  }

  if (
    combinedName.includes('crunch') ||
    combinedName.includes('sit-up') ||
    combinedName.includes('gập bụng')
  ) {
    return BODYWEIGHT_ENGAGEMENT_FACTORS.crunch; // 0.4
  }

  return BODYWEIGHT_ENGAGEMENT_FACTORS.default;
}

/**
 * Automatically classifies an exercise into one of the 4 biomechanical types
 * if `exercise.exerciseType` is not explicitly provided.
 */
export function classifyExerciseType(
  exercise?: Pick<ExerciseModel, 'name' | 'vietnameseName' | 'exerciseType'> | null,
  equipment?: string
): ExerciseType {
  if (exercise?.exerciseType) {
    return exercise.exerciseType;
  }

  const combined = `${exercise?.name || ''} ${exercise?.vietnameseName || ''} ${equipment || ''}`.toLowerCase();

  if (
    combined.includes('assisted') ||
    combined.includes('trợ lực') ||
    combined.includes('machine assisted') ||
    combined.includes('band assisted')
  ) {
    return 'ASSISTED_BODYWEIGHT';
  }

  if (
    combined.includes('weighted pull') ||
    combined.includes('weighted dip') ||
    combined.includes('weighted chin') ||
    combined.includes('weighted push') ||
    combined.includes('weighted muscle') ||
    combined.includes('đeo tạ') ||
    combined.includes('thêm tạ')
  ) {
    return 'WEIGHTED_BODYWEIGHT';
  }

  const isBodyweightKeyword =
    combined.includes('push-up') ||
    combined.includes('push up') ||
    combined.includes('pushup') ||
    combined.includes('hít đất') ||
    combined.includes('chống đẩy') ||
    combined.includes('bodyweight') ||
    combined.includes('body only') ||
    combined.includes('tự trọng') ||
    ((combined.includes('pull-up') ||
      combined.includes('pull up') ||
      combined.includes('chin-up') ||
      combined.includes('kéo xà')) &&
      !combined.includes('lat pulldown') &&
      !combined.includes('cable'));

  if (isBodyweightKeyword) {
    return 'BODYWEIGHT_ONLY';
  }

  return 'BARBELL_DUMBBELL_CABLE';
}

/**
 * Resolves a safe, non-negative user bodyweight in kg.
 * Falls back to `DEFAULT_USER_BODYWEIGHT_KG` (70 kg) if biometrics are missing, NaN, or <= 0.
 */
export function resolveUserBodyweightKg(biometrics?: UserBiometrics | null): number {
  const rawBw = biometrics?.bodyweightKg;
  if (rawBw === undefined || rawBw === null || Number.isNaN(rawBw) || rawBw <= 0) {
    return DEFAULT_USER_BODYWEIGHT_KG;
  }
  return Math.min(350, Math.max(20, rawBw));
}

/**
 * Resolves the canonical `Effective Weight` (in kg) for a given exercise, set, and user biometric context.
 *
 * Formulas:
 * - `BARBELL_DUMBBELL_CABLE`: Effective Weight = max(0, weight)
 * - `WEIGHTED_BODYWEIGHT`: Effective Weight = user_bodyweight + max(0, added_weight)
 * - `ASSISTED_BODYWEIGHT`: Effective Weight = max(0, user_bodyweight - abs(assisted_weight))
 * - `BODYWEIGHT_ONLY`: Effective Weight = user_bodyweight * alpha
 */
export function resolveEffectiveWeightKg(
  exercise: Pick<ExerciseModel, 'name' | 'vietnameseName' | 'exerciseType' | 'bodyweightEngagementFactor'>,
  set: Pick<WorkoutSetModel, 'weight' | 'baseWeightKg' | 'addedWeightKg' | 'assistedWeightKg'>,
  biometrics?: UserBiometrics | null
): number {
  const exType = classifyExerciseType(exercise);
  const rawSetWeight =
    set.baseWeightKg !== undefined && !Number.isNaN(set.baseWeightKg)
      ? set.baseWeightKg
      : set.weight;
  const sanitizedWeight = Number.isNaN(rawSetWeight) ? 0 : rawSetWeight;

  switch (exType) {
    case 'BARBELL_DUMBBELL_CABLE': {
      return Math.max(0, sanitizedWeight);
    }

    case 'WEIGHTED_BODYWEIGHT': {
      const bwKg = resolveUserBodyweightKg(biometrics);
      const rawAdded =
        set.addedWeightKg !== undefined && !Number.isNaN(set.addedWeightKg)
          ? set.addedWeightKg
          : sanitizedWeight;
      const addedKg = Math.max(0, rawAdded);
      return Number((bwKg + addedKg).toFixed(4));
    }

    case 'ASSISTED_BODYWEIGHT': {
      const bwKg = resolveUserBodyweightKg(biometrics);
      const rawAssisted =
        set.assistedWeightKg !== undefined && !Number.isNaN(set.assistedWeightKg)
          ? set.assistedWeightKg
          : sanitizedWeight;
      // Gracefully handle negative assistance (e.g. user enters -20 kg or 20 kg for assistance)
      const assistedKg = Math.abs(Number.isNaN(rawAssisted) ? 0 : rawAssisted);
      return Number(Math.max(0, bwKg - assistedKg).toFixed(4));
    }

    case 'BODYWEIGHT_ONLY': {
      const bwKg = resolveUserBodyweightKg(biometrics);
      const alpha = resolveBodyweightEngagementFactor(exercise);
      return Number((bwKg * alpha).toFixed(4));
    }

    default:
      return Math.max(0, sanitizedWeight);
  }
}

/**
 * Pure calculation function: `calculateSetVolume()`
 *
 * Computes the mechanical volume (in kg) moved in a single set across all 4 exercise types:
 * - `BARBELL_DUMBBELL_CABLE`: Volume = Weight * Reps
 * - `WEIGHTED_BODYWEIGHT`: Volume = (user_bodyweight + added_weight) * Reps
 * - `ASSISTED_BODYWEIGHT`: Volume = max(0, user_bodyweight - assisted_weight) * Reps
 * - `BODYWEIGHT_ONLY`: Volume = (user_bodyweight * alpha) * Reps
 *
 * Gracefully handles zero reps, zero/negative weights, and missing user bodyweight.
 */
export function calculateSetVolume(
  exercise: Pick<ExerciseModel, 'name' | 'vietnameseName' | 'exerciseType' | 'bodyweightEngagementFactor'>,
  set: Pick<WorkoutSetModel, 'weight' | 'baseWeightKg' | 'addedWeightKg' | 'assistedWeightKg' | 'reps'>,
  biometrics?: UserBiometrics | null
): number {
  const reps = Number.isNaN(set.reps) ? 0 : Math.max(0, Math.floor(set.reps));
  if (reps <= 0) {
    return 0;
  }

  const effectiveWeightKg = resolveEffectiveWeightKg(exercise, set, biometrics);
  if (effectiveWeightKg <= 0) {
    return 0;
  }

  return Number((effectiveWeightKg * reps).toFixed(2));
}

/**
 * Pure calculation function: `calculateSetE1RM()`
 *
 * Computes the Estimated 1-Rep Max (E1RM in kg) using the Epley formula:
 *   E1RM = EffectiveWeight * (1 + Reps / 30)
 *
 * Note:
 * - Even when a single rep is performed (or multiple reps), the specification defines
 *   `E1RM = Effective Weight * (1 + Reps / 30)` for `BARBELL_DUMBBELL_CABLE` and `WEIGHTED_BODYWEIGHT`,
 *   and generalizes across `ASSISTED_BODYWEIGHT` and `BODYWEIGHT_ONLY` using `Effective Weight`.
 * - Returns 0 if `reps <= 0` or `EffectiveWeight <= 0`.
 */
export function calculateSetE1RM(
  exercise: Pick<ExerciseModel, 'name' | 'vietnameseName' | 'exerciseType' | 'bodyweightEngagementFactor'>,
  set: Pick<WorkoutSetModel, 'weight' | 'baseWeightKg' | 'addedWeightKg' | 'assistedWeightKg' | 'reps' | 'rpe'>,
  biometrics?: UserBiometrics | null,
  options?: { includeRirFromRpe?: boolean }
): number {
  const reps = Number.isNaN(set.reps) ? 0 : Math.max(0, Math.floor(set.reps));
  if (reps <= 0) {
    return 0;
  }

  const effectiveWeightKg = resolveEffectiveWeightKg(exercise, set, biometrics);
  if (effectiveWeightKg <= 0) {
    return 0;
  }

  let effectiveReps = reps;
  if (
    options?.includeRirFromRpe &&
    set.rpe !== undefined &&
    !Number.isNaN(set.rpe) &&
    set.rpe >= 6 &&
    set.rpe <= 10
  ) {
    effectiveReps = reps + Math.max(0, 10 - set.rpe);
  }

  const rawE1rm = effectiveWeightKg * (1 + effectiveReps / 30);
  return Math.round(rawE1rm * 10) / 10;
}

/**
 * Human-friendly Vietnamese metadata for each ExerciseType badge/selector in the Logger UI.
 */
export const EXERCISE_TYPE_META: Record<
  ExerciseType,
  {
    shortLabel: string;
    fullLabel: string;
    weightColumnHeader: (unit: WeightUnit) => string;
    formulaHint: string;
  }
> = {
  BARBELL_DUMBBELL_CABLE: {
    shortLabel: 'Tạ chuẩn',
    fullLabel: 'Tạ đòn / Tạ đơn / Dây cáp',
    weightColumnHeader: (u) => (u === 'lbs' ? 'Lbs' : 'Kg'),
    formulaHint: 'Tải thực = Mức tạ',
  },
  WEIGHTED_BODYWEIGHT: {
    shortLabel: 'Đeo tạ (+BW)',
    fullLabel: 'Tự trọng + Tạ đeo thêm',
    weightColumnHeader: (u) => `+${u === 'lbs' ? 'Lbs' : 'Kg'}`,
    formulaHint: 'Tải thực = BW + Tạ thêm',
  },
  ASSISTED_BODYWEIGHT: {
    shortLabel: 'Trợ lực (-BW)',
    fullLabel: 'Máy / Dây kháng lực trợ lực',
    weightColumnHeader: (u) => `-${u === 'lbs' ? 'Lbs' : 'Kg'}`,
    formulaHint: 'Tải thực = max(0, BW − Trợ lực)',
  },
  BODYWEIGHT_ONLY: {
    shortLabel: 'Tự trọng (BW×α)',
    fullLabel: 'Trọng lượng cơ thể thuần túy',
    weightColumnHeader: () => 'Hệ số α',
    formulaHint: 'Tải thực = BW × α',
  },
};
