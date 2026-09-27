import { WorkoutExercise, ExerciseSet } from '../types/gym';

export type SupersetGroupType = 'SUPERSET' | 'TRISET' | 'GIANT_SET';

export type RestTimerTriggerType = 'NONE' | 'INTRA_SUPERSET' | 'INTER_ROUND' | 'STANDARD_SINGLE';

/**
 * Data Model for grouping 2 or more exercises into a Superset (2), Tri-set (3), or Giant Set (4+).
 */
export interface SupersetGroup {
  id: string;
  groupType: SupersetGroupType;
  title?: string;
  /**
   * Ordered list of exercise IDs belonging to this group (e.g., [ExA.id, ExB.id, ExC.id]).
   */
  exerciseIds: string[];
  /**
   * Short transition rest (in seconds) between Exercise A and Exercise B within the same round.
   * Can be 0s (immediate transition) or e.g. 15s–20s.
   */
  intraRestSeconds: number;
  /**
   * Main recovery rest timer (in seconds) triggered ONLY after the final incomplete exercise set
   * in a round is checked off.
   */
  interRoundRestSeconds: number;
}

export interface InterleavedExecutionStep {
  /** Global 0-based index in the flattened interleaved sequence */
  stepIndex: number;
  /** 1-based round number (Round 1 = Set 1 of each grouped exercise) */
  roundNumber: number;
  /** 0-based index of the exercise within the SupersetGroup */
  exerciseGroupOrder: number;
  /** Station badge code, e.g., "A1", "A2", "A3" */
  stationCode: string;
  exerciseId: string;
  exerciseIdxInSession: number;
  exerciseName: string;
  exerciseVietnameseName: string;
  setIdxInExercise: number;
  set: ExerciseSet;
  isLastStepInRound: boolean;
  /** Expected rest after this step in linear execution order */
  plannedRestSeconds: number;
  plannedRestType: 'INTRA_SUPERSET' | 'INTER_ROUND';
}

export interface InterleavedRound {
  roundNumber: number;
  steps: InterleavedExecutionStep[];
  isRoundCompleted: boolean;
  completedCount: number;
  totalCount: number;
  interRoundRestSeconds: number;
}

export interface SupersetRestResolution {
  shouldTriggerRest: boolean;
  restType: RestTimerTriggerType;
  restDurationSeconds: number;
  completedRoundNumber: number;
  isRoundFullyCompleted: boolean;
  nextActiveStep: InterleavedExecutionStep | null;
}

/**
 * Determines `SupersetGroupType` from the number of exercises in the group.
 */
export function resolveSupersetGroupType(exerciseCount: number): SupersetGroupType {
  if (exerciseCount <= 2) return 'SUPERSET';
  if (exerciseCount === 3) return 'TRISET';
  return 'GIANT_SET';
}

/**
 * Creates a normalized `SupersetGroup` from 2 or more exercise IDs.
 */
export function createSupersetGroup(params: {
  id?: string;
  exerciseIds: string[];
  title?: string;
  intraRestSeconds?: number;
  interRoundRestSeconds?: number;
}): SupersetGroup {
  const uniqueIds = Array.from(new Set(params.exerciseIds));
  const groupType = resolveSupersetGroupType(uniqueIds.length);
  const defaultTitle =
    groupType === 'TRISET'
      ? 'Tri-set Liên Hoàn (3 Bài)'
      : groupType === 'GIANT_SET'
      ? `Giant Set (${uniqueIds.length} Bài)`
      : 'Superset Đối Kháng (2 Bài)';

  return {
    id: params.id || `ss-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    groupType,
    title: params.title || defaultTitle,
    exerciseIds: uniqueIds,
    intraRestSeconds: params.intraRestSeconds ?? 15,
    interRoundRestSeconds: params.interRoundRestSeconds ?? 90,
  };
}

/**
 * Builds the non-linear interleaved execution sequence and round breakdown for a `SupersetGroup`.
 *
 * Example for [ExA (3 sets), ExB (3 sets)]:
 * Round 1: [ExA_Set1 (A1), ExB_Set1 (A2)] -> Inter-Round Rest (90s)
 * Round 2: [ExA_Set2 (A1), ExB_Set2 (A2)] -> Inter-Round Rest (90s)
 * Round 3: [ExA_Set3 (A1), ExB_Set3 (A2)] -> Inter-Round Rest (90s)
 */
export function buildInterleavedExecutionSequence(
  group: SupersetGroup,
  allSessionExercises: WorkoutExercise[],
  groupPrefixLetter: string = 'A'
): {
  executionSequence: InterleavedExecutionStep[];
  rounds: InterleavedRound[];
  activeStep: InterleavedExecutionStep | null;
} {
  const groupedExercises = group.exerciseIds
    .map((id) => {
      const idx = allSessionExercises.findIndex((ex) => ex.id === id);
      return idx >= 0 ? { exercise: allSessionExercises[idx], sessionIdx: idx } : null;
    })
    .filter((item): item is { exercise: WorkoutExercise; sessionIdx: number } => item !== null);

  if (groupedExercises.length === 0) {
    return { executionSequence: [], rounds: [], activeStep: null };
  }

  const maxSetsCount = Math.max(0, ...groupedExercises.map((g) => g.exercise.sets.length));
  const executionSequence: InterleavedExecutionStep[] = [];
  const rounds: InterleavedRound[] = [];

  let globalStepIndex = 0;

  for (let roundIdx = 0; roundIdx < maxSetsCount; roundIdx++) {
    const roundNumber = roundIdx + 1;
    const stepsInThisRound: InterleavedExecutionStep[] = [];

    // First collect all exercises that have a set in this round
    const exercisesInRound = groupedExercises.filter(
      (g) => roundIdx < g.exercise.sets.length
    );

    exercisesInRound.forEach((g, idxInRound) => {
      const set = g.exercise.sets[roundIdx];
      const exerciseGroupOrder = groupedExercises.findIndex(
        (item) => item.exercise.id === g.exercise.id
      );
      const isLastStepInRound = idxInRound === exercisesInRound.length - 1;
      const plannedRestType = isLastStepInRound ? 'INTER_ROUND' : 'INTRA_SUPERSET';
      const plannedRestSeconds = isLastStepInRound
        ? group.interRoundRestSeconds
        : group.intraRestSeconds;

      const step: InterleavedExecutionStep = {
        stepIndex: globalStepIndex++,
        roundNumber,
        exerciseGroupOrder,
        stationCode: `${groupPrefixLetter}${exerciseGroupOrder + 1}`,
        exerciseId: g.exercise.id,
        exerciseIdxInSession: g.sessionIdx,
        exerciseName: g.exercise.name,
        exerciseVietnameseName: g.exercise.vietnameseName,
        setIdxInExercise: roundIdx,
        set,
        isLastStepInRound,
        plannedRestSeconds,
        plannedRestType,
      };

      stepsInThisRound.push(step);
      executionSequence.push(step);
    });

    if (stepsInThisRound.length > 0) {
      const completedCount = stepsInThisRound.filter((s) => s.set.completed).length;
      rounds.push({
        roundNumber,
        steps: stepsInThisRound,
        isRoundCompleted: completedCount === stepsInThisRound.length,
        completedCount,
        totalCount: stepsInThisRound.length,
        interRoundRestSeconds: group.interRoundRestSeconds,
      });
    }
  }

  const activeStep = executionSequence.find((step) => !step.set.completed) ?? null;

  return {
    executionSequence,
    rounds,
    activeStep,
  };
}

/**
 * Evaluates the exact Rest Timer behavior and next active focus step when a user toggles a set
 * inside a Superset or Tri-set (including out-of-order set completion!).
 *
 * Edge-Case Rule:
 * - Suppose a Tri-set has [ExA, ExB, ExC].
 * - In Round 1, user checks ExA_Set1 -> Round 1 has 1/3 done -> triggers `INTRA_SUPERSET` rest (e.g. 15s),
 *   nextActiveStep is ExB_Set1.
 * - Next, user checks ExC_Set1 out of order (skipping ExB_Set1) -> Even though ExC is the 3rd exercise,
 *   Round 1 is still only 2/3 done (ExB_Set1 is unchecked!) -> triggers `INTRA_SUPERSET` rest (15s)
 *   and focuses ExB_Set1!
 * - Finally, user checks ExB_Set1 -> Now Round 1 is 3/3 completed! -> Triggers `INTER_ROUND` main rest (90s)
 *   and advances focus to Round 2 (ExA_Set2).
 */
export function resolveSupersetRestOnSetToggle(
  group: SupersetGroup,
  updatedExercises: WorkoutExercise[],
  toggledExerciseId: string,
  toggledSetIdx: number,
  groupPrefixLetter: string = 'A'
): SupersetRestResolution {
  const { executionSequence, rounds, activeStep } = buildInterleavedExecutionSequence(
    group,
    updatedExercises,
    groupPrefixLetter
  );

  const toggledStep = executionSequence.find(
    (s) => s.exerciseId === toggledExerciseId && s.setIdxInExercise === toggledSetIdx
  );

  if (!toggledStep || !toggledStep.set.completed) {
    // Set was unchecked or not found -> do not start rest timer
    return {
      shouldTriggerRest: false,
      restType: 'NONE',
      restDurationSeconds: 0,
      completedRoundNumber: toggledStep ? toggledStep.roundNumber : 1,
      isRoundFullyCompleted: false,
      nextActiveStep: activeStep,
    };
  }

  const targetRound = rounds.find((r) => r.roundNumber === toggledStep.roundNumber);
  const isRoundFullyCompleted = Boolean(targetRound?.isRoundCompleted);

  // Prioritize the next incomplete step within the SAME round if user completed out of order,
  // otherwise fall back to the first incomplete step globally.
  const nextIncompleteInSameRound =
    targetRound?.steps.find((s) => !s.set.completed) ?? null;
  const nextActiveStep = nextIncompleteInSameRound ?? activeStep;

  if (isRoundFullyCompleted) {
    return {
      shouldTriggerRest: group.interRoundRestSeconds > 0,
      restType: 'INTER_ROUND',
      restDurationSeconds: group.interRoundRestSeconds,
      completedRoundNumber: toggledStep.roundNumber,
      isRoundFullyCompleted: true,
      nextActiveStep,
    };
  }

  return {
    shouldTriggerRest: group.intraRestSeconds > 0,
    restType: 'INTRA_SUPERSET',
    restDurationSeconds: group.intraRestSeconds,
    completedRoundNumber: toggledStep.roundNumber,
    isRoundFullyCompleted: false,
    nextActiveStep,
  };
}
