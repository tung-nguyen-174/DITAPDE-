import {
  calculateSetVolume,
  calculateSetE1RM,
  resolveEffectiveWeightKg,
  classifyExerciseType,
  resolveBodyweightEngagementFactor,
  DEFAULT_USER_BODYWEIGHT_KG,
  ExerciseModel,
  WorkoutSetModel,
  UserBiometrics,
} from '../workoutExecutionEngine';
import {
  createSupersetGroup,
  buildInterleavedExecutionSequence,
  resolveSupersetRestOnSetToggle,
} from '../supersetExecutionEngine';
import { UnitConverter, KG_TO_LBS_FACTOR } from '../unitConverter';
import { WorkoutExercise } from '../../types/gym';

export interface EngineTestResult {
  id: string;
  category: 'TASK_1_BODYWEIGHT' | 'TASK_2_SUPERSET' | 'TASK_3_UNIT_NORMALIZATION';
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

/**
 * Self-contained deterministic test runner covering all Task 1, Task 2, and Task 3
 * edge cases (0 lbs, negative assistance, missing bodyweight fallback, out-of-order
 * 3-exercise tri-set completion, lossless kg <-> lbs round-trip conversion).
 */
export function runWorkoutEngineTestSuite(): {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  results: EngineTestResult[];
} {
  const results: EngineTestResult[] = [];

  const assertEqual = (
    id: string,
    category: EngineTestResult['category'],
    name: string,
    actual: unknown,
    expected: unknown
  ) => {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    results.push({
      id,
      category,
      name,
      passed: actualStr === expectedStr,
      expected: expectedStr,
      actual: actualStr,
    });
  };

  // ============================================================================
  // TASK 1: Bodyweight & Modified Weight Algorithms
  // ============================================================================

  // 1.1 Standard BARBELL_DUMBBELL_CABLE: 100 kg x 10 reps -> Volume = 1000, E1RM = 133.3
  const benchEx: ExerciseModel = {
    id: 'ex-bench',
    name: 'Barbell Bench Press',
    exerciseType: 'BARBELL_DUMBBELL_CABLE',
  };
  const benchSet: WorkoutSetModel = {
    id: 's1',
    setNumber: 1,
    setType: 'N',
    weight: 100,
    reps: 10,
    completed: true,
  };
  assertEqual(
    'T1-01',
    'TASK_1_BODYWEIGHT',
    'Standard Barbell Volume (100kg × 10 reps = 1000kg)',
    calculateSetVolume(benchEx, benchSet),
    1000
  );
  assertEqual(
    'T1-02',
    'TASK_1_BODYWEIGHT',
    'Standard Barbell E1RM (100kg × (1 + 10/30) = 133.3kg)',
    calculateSetE1RM(benchEx, benchSet),
    133.3
  );

  // 1.2 Edge Case: User enters 0 lbs / 0 kg -> Volume = 0, E1RM = 0
  const zeroWeightSet: WorkoutSetModel = {
    id: 's-zero',
    setNumber: 1,
    setType: 'N',
    weight: UnitConverter.toDatabaseValue(0, 'lbs'),
    reps: 12,
    completed: true,
  };
  assertEqual(
    'T1-03',
    'TASK_1_BODYWEIGHT',
    'Zero weight input (0 lbs × 12 reps) yields 0 Volume & 0 E1RM',
    {
      vol: calculateSetVolume(benchEx, zeroWeightSet),
      e1rm: calculateSetE1RM(benchEx, zeroWeightSet),
    },
    { vol: 0, e1rm: 0 }
  );

  // 1.3 WEIGHTED_BODYWEIGHT (Weighted Pull-up: 75kg BW + 25kg plate = 100kg effective × 6 reps)
  const weightedPullup: ExerciseModel = {
    id: 'ex-wpull',
    name: 'Weighted Pull-ups',
    exerciseType: 'WEIGHTED_BODYWEIGHT',
  };
  const weightedSet: WorkoutSetModel = {
    id: 's-wp',
    setNumber: 1,
    setType: 'N',
    weight: 25,
    addedWeightKg: 25,
    reps: 6,
    completed: true,
  };
  const userBio75: UserBiometrics = { bodyweightKg: 75 };
  assertEqual(
    'T1-04',
    'TASK_1_BODYWEIGHT',
    'Weighted Pull-up (75kg BW + 25kg added = 100kg eff × 6 reps -> Vol 600, E1RM 120)',
    {
      eff: resolveEffectiveWeightKg(weightedPullup, weightedSet, userBio75),
      vol: calculateSetVolume(weightedPullup, weightedSet, userBio75),
      e1rm: calculateSetE1RM(weightedPullup, weightedSet, userBio75),
    },
    { eff: 100, vol: 600, e1rm: 120 }
  );

  // 1.4 Edge Case: Missing/Null User Bodyweight Fallback (defaults to 70kg)
  assertEqual(
    'T1-05',
    'TASK_1_BODYWEIGHT',
    'Missing bodyweight fallback (null BW -> 70kg default + 20kg added = 90kg eff)',
    resolveEffectiveWeightKg(
      weightedPullup,
      { ...weightedSet, weight: 20, addedWeightKg: 20 },
      { bodyweightKg: null }
    ),
    DEFAULT_USER_BODYWEIGHT_KG + 20
  );

  // 1.5 ASSISTED_BODYWEIGHT (75kg BW - 20kg assistance = 55kg effective × 10 reps = 550kg)
  const assistedPullup: ExerciseModel = {
    id: 'ex-apull',
    name: 'Machine Assisted Pull-ups',
    exerciseType: 'ASSISTED_BODYWEIGHT',
  };
  const assistedSet: WorkoutSetModel = {
    id: 's-ap',
    setNumber: 1,
    setType: 'N',
    weight: 20,
    assistedWeightKg: 20,
    reps: 10,
    completed: true,
  };
  assertEqual(
    'T1-06',
    'TASK_1_BODYWEIGHT',
    'Assisted Pull-up (75kg BW - 20kg assistance = 55kg eff × 10 reps = 550kg)',
    {
      eff: resolveEffectiveWeightKg(assistedPullup, assistedSet, userBio75),
      vol: calculateSetVolume(assistedPullup, assistedSet, userBio75),
    },
    { eff: 55, vol: 550 }
  );

  // 1.6 Edge Case: Negative assistance input (-20kg) and Excessive assistance (> BW -> clamped to 0)
  assertEqual(
    'T1-07',
    'TASK_1_BODYWEIGHT',
    'Negative assistance (-20kg) & Over-assistance (95kg > 75kg BW -> 0kg clamped)',
    {
      negAssistEff: resolveEffectiveWeightKg(
        assistedPullup,
        { ...assistedSet, weight: -20, assistedWeightKg: -20 },
        userBio75
      ),
      overAssistVol: calculateSetVolume(
        assistedPullup,
        { ...assistedSet, weight: 95, assistedWeightKg: 95 },
        userBio75
      ),
    },
    { negAssistEff: 55, overAssistVol: 0 }
  );

  // 1.7 BODYWEIGHT_ONLY (Push-up alpha = 0.64, Pull-up alpha = 1.0)
  const pushupEx: ExerciseModel = {
    id: 'ex-pushup',
    name: 'Push-ups (Hít đất)',
    exerciseType: 'BODYWEIGHT_ONLY',
  };
  const bwSet20Reps: WorkoutSetModel = {
    id: 's-bw',
    setNumber: 1,
    setType: 'N',
    weight: 0,
    reps: 20,
    completed: true,
  };
  // 75kg * 0.64 = 48kg effective; 48kg * 20 reps = 960kg volume
  assertEqual(
    'T1-08',
    'TASK_1_BODYWEIGHT',
    'Bodyweight Push-up engagement factor (α = 0.64 × 75kg = 48kg eff × 20 reps = 960kg)',
    {
      alpha: resolveBodyweightEngagementFactor(pushupEx),
      eff: resolveEffectiveWeightKg(pushupEx, bwSet20Reps, userBio75),
      vol: calculateSetVolume(pushupEx, bwSet20Reps, userBio75),
      autoType: classifyExerciseType({ name: 'Push-ups' }),
    },
    { alpha: 0.64, eff: 48, vol: 960, autoType: 'BODYWEIGHT_ONLY' }
  );

  // ============================================================================
  // TASK 2: Superset & Tri-set Interleaved Execution & Out-of-Order Edge Cases
  // ============================================================================

  const makeMockTriSetExercises = (): WorkoutExercise[] => [
    {
      id: 'ex-a',
      name: 'Incline Dumbbell Press',
      vietnameseName: 'Đẩy ngực trên tạ đơn',
      primaryMuscle: 'chest',
      secondaryMuscles: ['front_delts'],
      sets: [
        { id: 'a-1', setNumber: 1, setType: 'N', previous: '-', weight: 30, reps: 10, rpe: 8, completed: false },
        { id: 'a-2', setNumber: 2, setType: 'N', previous: '-', weight: 30, reps: 10, rpe: 8.5, completed: false },
      ],
    },
    {
      id: 'ex-b',
      name: 'Cable Lateral Raise',
      vietnameseName: 'Bay vai cáp',
      primaryMuscle: 'side_delts',
      secondaryMuscles: [],
      sets: [
        { id: 'b-1', setNumber: 1, setType: 'N', previous: '-', weight: 10, reps: 15, rpe: 8, completed: false },
        { id: 'b-2', setNumber: 2, setType: 'N', previous: '-', weight: 10, reps: 15, rpe: 8.5, completed: false },
      ],
    },
    {
      id: 'ex-c',
      name: 'Rope Tricep Pushdown',
      vietnameseName: 'Kéo cáp tay sau',
      primaryMuscle: 'triceps',
      secondaryMuscles: [],
      sets: [
        { id: 'c-1', setNumber: 1, setType: 'N', previous: '-', weight: 25, reps: 12, rpe: 8, completed: false },
        { id: 'c-2', setNumber: 2, setType: 'N', previous: '-', weight: 25, reps: 12, rpe: 9, completed: false },
      ],
    },
  ];

  const triSetExercises = makeMockTriSetExercises();
  const triSetGroup = createSupersetGroup({
    id: 'triset-1',
    exerciseIds: ['ex-a', 'ex-b', 'ex-c'],
    intraRestSeconds: 15,
    interRoundRestSeconds: 90,
  });

  const initialSeq = buildInterleavedExecutionSequence(triSetGroup, triSetExercises, 'A');
  assertEqual(
    'T2-01',
    'TASK_2_SUPERSET',
    'Tri-set builds interleaved 6-step sequence [A1_S1, A2_S1, A3_S1, A1_S2, A2_S2, A3_S2]',
    initialSeq.executionSequence.map((s) => `${s.stationCode}_S${s.set.setNumber}`),
    ['A1_S1', 'A2_S1', 'A3_S1', 'A1_S2', 'A2_S2', 'A3_S2']
  );

  // Step 1: Complete ExA Set 1 -> Intra-superset rest (15s), next active is ExB Set 1 (A2_S1)
  triSetExercises[0].sets[0].completed = true;
  const resAfterA1 = resolveSupersetRestOnSetToggle(triSetGroup, triSetExercises, 'ex-a', 0, 'A');
  assertEqual(
    'T2-02',
    'TASK_2_SUPERSET',
    'Completing A1_S1 triggers INTRA_SUPERSET rest (15s) & focuses A2_S1',
    {
      restType: resAfterA1.restType,
      restSec: resAfterA1.restDurationSeconds,
      nextFocus: `${resAfterA1.nextActiveStep?.stationCode}_S${resAfterA1.nextActiveStep?.set.setNumber}`,
    },
    { restType: 'INTRA_SUPERSET', restSec: 15, nextFocus: 'A2_S1' }
  );

  // Step 2 (OUT OF ORDER): User skips ExB Set 1 and checks ExC Set 1 (A3_S1) first!
  // Because A2_S1 is still incomplete in Round 1, it MUST NOT trigger Inter-Round 90s rest yet!
  triSetExercises[2].sets[0].completed = true;
  const resAfterOutOfOrderC1 = resolveSupersetRestOnSetToggle(
    triSetGroup,
    triSetExercises,
    'ex-c',
    0,
    'A'
  );
  assertEqual(
    'T2-03',
    'TASK_2_SUPERSET',
    'Out-of-order completion of A3_S1 (while A2_S1 is pending) triggers INTRA_SUPERSET (15s) & focuses A2_S1',
    {
      restType: resAfterOutOfOrderC1.restType,
      restSec: resAfterOutOfOrderC1.restDurationSeconds,
      roundDone: resAfterOutOfOrderC1.isRoundFullyCompleted,
      nextFocus: `${resAfterOutOfOrderC1.nextActiveStep?.stationCode}_S${resAfterOutOfOrderC1.nextActiveStep?.set.setNumber}`,
    },
    {
      restType: 'INTRA_SUPERSET',
      restSec: 15,
      roundDone: false,
      nextFocus: 'A2_S1',
    }
  );

  // Step 3: User now completes the remaining A2_S1 in Round 1 -> Round 1 is 3/3 complete!
  // Now it MUST trigger INTER_ROUND rest (90s) and advance focus to Round 2 (A1_S2).
  triSetExercises[1].sets[0].completed = true;
  const resAfterB1CompletesRound1 = resolveSupersetRestOnSetToggle(
    triSetGroup,
    triSetExercises,
    'ex-b',
    0,
    'A'
  );
  assertEqual(
    'T2-04',
    'TASK_2_SUPERSET',
    'Completing remaining A2_S1 finishes Round 1 -> triggers INTER_ROUND rest (90s) & focuses A1_S2',
    {
      restType: resAfterB1CompletesRound1.restType,
      restSec: resAfterB1CompletesRound1.restDurationSeconds,
      roundDone: resAfterB1CompletesRound1.isRoundFullyCompleted,
      nextFocus: `${resAfterB1CompletesRound1.nextActiveStep?.stationCode}_S${resAfterB1CompletesRound1.nextActiveStep?.set.setNumber}`,
    },
    {
      restType: 'INTER_ROUND',
      restSec: 90,
      roundDone: true,
      nextFocus: 'A1_S2',
    }
  );

  // ============================================================================
  // TASK 3: Lossless Multi-Unit Normalization Architecture (kg <-> lbs)
  // ============================================================================

  // 3.1 100 kg -> 220 lbs display (100 * 2.2046226218 = 220.462 -> rounded to 220 lbs)
  const canonical100Kg = 100;
  const displayedLbs = UnitConverter.toDisplayValue(canonical100Kg, 'lbs');
  // Toggling back or blurring without changing the displayed 220 lbs preserves exact 100.0 kg!
  const preservedKg = UnitConverter.toDatabaseValue(displayedLbs, 'lbs', canonical100Kg);
  assertEqual(
    'T3-01',
    'TASK_3_UNIT_NORMALIZATION',
    'Lossless unit switch (100 kg -> 220 lbs display -> preserves exact 100.0000 kg in DB)',
    { displayedLbs, preservedKg },
    { displayedLbs: 220, preservedKg: 100 }
  );

  // 3.2 Entering 225 lbs in LBS mode stores exact kg (102.05828325 kg) and displays 102 kg in KG mode
  const dbFrom225Lbs = UnitConverter.toDatabaseValue(225, 'lbs');
  const expected225InKg = Number((225 / KG_TO_LBS_FACTOR).toFixed(8));
  assertEqual(
    'T3-02',
    'TASK_3_UNIT_NORMALIZATION',
    'Entering 225 lbs stores exact base_weight_kg (102.05828325 kg) & renders 225 lbs / 102 kg',
    {
      dbFrom225Lbs,
      backToLbsDisplay: UnitConverter.toDisplayValue(dbFrom225Lbs, 'lbs'),
      toKgDisplay: UnitConverter.toDisplayValue(dbFrom225Lbs, 'kg'),
    },
    {
      dbFrom225Lbs: expected225InKg,
      backToLbsDisplay: 225,
      toKgDisplay: 102,
    }
  );

  const passedCount = results.filter((r) => r.passed).length;
  return {
    allPassed: passedCount === results.length,
    passedCount,
    totalCount: results.length,
    results,
  };
}
