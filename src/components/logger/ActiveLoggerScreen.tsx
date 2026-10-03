import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  Clock, 
  Disc, 
  Plus, 
  Trash2, 
  Flame,
  Search,
  Dumbbell,
  Trophy,
  CheckCircle2
} from 'lucide-react';
import { WorkoutSession, WorkoutExercise, ExerciseSet, MuscleGroup } from '../../types/gym';
import { PlateCalculatorModal } from '../common/PlateCalculatorModal';
import { RestTimerDrawer } from '../common/RestTimerDrawer';
import { ValidatedSetRow } from './ValidatedSetRow';
import { SupersetGroupCard } from './SupersetGroupCard';
import { WorkoutEngineToolbar } from './WorkoutEngineToolbar';
import {
  getSetsBestE1RM,
  SetCalculator,
  TelemetryParser,
  calculateCompoundLiftsE1RM,
  COMPOUND_LIFT_DEFINITIONS,
  CompoundLiftKey,
} from '../../utils/fitnessCalculations';
import { WorkoutDraftCacheService } from '../../services/workoutDraftCacheService';
import {
  ExerciseType,
  EXERCISE_TYPE_META,
  classifyExerciseType,
  calculateSetVolume,
  resolveEffectiveWeightKg,
  DEFAULT_USER_BODYWEIGHT_KG,
} from '../../engine/workoutExecutionEngine';
import {
  SupersetGroup,
  createSupersetGroup,
  resolveSupersetRestOnSetToggle,
} from '../../engine/supersetExecutionEngine';
import { UnitConverter, WeightUnit } from '../../engine/unitConverter';
import {
  ALL_RAW_EXERCISES,
  mapStringToMuscleGroup,
  buildSetVolumeMapFromExercisesJson,
  matchesMuscleCategoryFilter,
  getMuscleGroupLabel,
  resolveExerciseMusclesFromJson,
} from '../../services/exerciseImporter';
import { getColorHexForVolume } from '../common/MuscleHeatmap';

interface ActiveLoggerScreenProps {
  session: WorkoutSession;
  onUpdateSession: (updated: WorkoutSession) => void;
  onFinishSession: (session: WorkoutSession) => void;
  onCancelSession: () => void;
  onDiscardSession?: () => void;
  onSimulateCrash?: (currentDraft: WorkoutSession) => void;
  isLandscape?: boolean;
  isTablet?: boolean;
}

export const ActiveLoggerScreen: React.FC<ActiveLoggerScreenProps> = ({
  session,
  onUpdateSession,
  onFinishSession,
  onCancelSession,
  onDiscardSession,
  onSimulateCrash,
}) => {
  const [sessionTitle, setSessionTitle] = useState(session.title);
  const [durationSeconds, setDurationSeconds] = useState(session.durationSeconds);
  const [exercises, setExercises] = useState<WorkoutExercise[]>(session.exercises);
  const [supersetGroups, setSupersetGroups] = useState<SupersetGroup[]>(
    session.supersetGroups || []
  );
  const [userBodyweightKg, setUserBodyweightKg] = useState<number>(
    session.userBodyweightKg || DEFAULT_USER_BODYWEIGHT_KG
  );
  const [unit, setUnit] = useState<WeightUnit>(session.preferredUnit || 'kg');
  const [plateCalcWeight, setPlateCalcWeight] = useState<number | null>(null);
  const [targetSetForCalc, setTargetSetForCalc] = useState<{ exIdx: number; setIdx: number } | null>(null);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number>(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [selectedMuscleCategory, setSelectedMuscleCategory] = useState<string>('Tất cả');

  // Re-sync local state if a newly initialized session is passed in
  useEffect(() => {
    setSessionTitle(session.title);
    setDurationSeconds(session.durationSeconds);
    setExercises(session.exercises);
    setSupersetGroups(session.supersetGroups || []);
    setUserBodyweightKg(session.userBodyweightKg || DEFAULT_USER_BODYWEIGHT_KG);
    setUnit(session.preferredUnit || 'kg');
  }, [session.id]);

  // Live Stopwatch starting from 00:00:00 and syncing draft to Local DB
  useEffect(() => {
    const interval = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session.id]);

  const totalTonnage = useMemo(
    () =>
      SetCalculator.calculateSessionTonnage(exercises, {
        bodyweightKg: userBodyweightKg,
        preferredUnit: unit,
      }),
    [exercises, userBodyweightKg, unit]
  );

  const totalCompletedSets = useMemo(
    () => SetCalculator.calculateCompletedSetsCount(exercises),
    [exercises]
  );

  const muscleSetsMap = useMemo<Partial<Record<MuscleGroup, number>>>(
    () => buildSetVolumeMapFromExercisesJson(exercises),
    [exercises]
  );

  // Calculate E1RM for top compound lifts (Bench, Squat, Deadlift, OHP) from current session's heaviest sets
  const compoundLiftsSummary = useMemo(
    () =>
      calculateCompoundLiftsE1RM(exercises, {
        bodyweightKg: userBodyweightKg,
        preferredUnit: unit,
      }),
    [exercises, userBodyweightKg, unit]
  );

  const topThreeCompoundLifts = useMemo(
    () => compoundLiftsSummary.filter((l) => l.isTopThreeSBD),
    [compoundLiftsSummary]
  );

  const syncedCompoundCount = useMemo(
    () => compoundLiftsSummary.filter((l) => l.hasSessionSet && l.e1rmKg > 0).length,
    [compoundLiftsSummary]
  );

  // Automatically sync compound lift E1RMs to 'Kỷ lục cá nhân' whenever session sets update
  useEffect(() => {
    if (exercises.length > 0) {
      WorkoutDraftCacheService.syncCompoundPRsFromSession({
        exercises,
        userBodyweightKg,
        preferredUnit: unit,
      });
    }
  }, [exercises, userBodyweightKg, unit]);

  const handleQuickAddCompoundLift = (liftKey: CompoundLiftKey) => {
    const def = COMPOUND_LIFT_DEFINITIONS.find((d) => d.key === liftKey);
    if (!def) return;
    const defaultWeight =
      liftKey === 'deadlift' ? 100 : liftKey === 'back_squat' ? 80 : liftKey === 'bench_press' ? 60 : 40;
    const newEx: WorkoutExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: def.defaultExerciseName,
      vietnameseName: def.vietnameseName,
      primaryMuscle: def.primaryMuscle,
      secondaryMuscles: [],
      sets: [
        {
          id: `set-${Date.now()}-1`,
          setNumber: 1,
          setType: 'N',
          previous: `${defaultWeight}kg × 5`,
          weight: defaultWeight,
          baseWeightKg: defaultWeight,
          reps: 5,
          rpe: 8.5,
          completed: true,
        },
      ],
    };
    const updated = [...exercises, newEx];
    setExercises(updated);
    syncSessionToParent(updated);
  };

  // Sync draft to parent & Local Cache when title changes or every 10s of elapsed timer
  useEffect(() => {
    if (durationSeconds % 10 === 0 || durationSeconds <= 1) {
      onUpdateSession({
        ...session,
        title: sessionTitle,
        durationSeconds,
        exercises,
        totalTonnageKg: totalTonnage,
        totalSets: totalCompletedSets,
      });
    }
  }, [durationSeconds, sessionTitle, totalTonnage, totalCompletedSets]);

  // Rest Timer Countdown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isRestTimerActive && restSecondsRemaining > 0) {
      timer = setInterval(() => {
        setRestSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsRestTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRestTimerActive, restSecondsRemaining]);

  const calculateTonnage = useCallback(
    (exList: WorkoutExercise[], bwKg: number = userBodyweightKg): number =>
      SetCalculator.calculateSessionTonnage(exList, {
        bodyweightKg: bwKg,
        preferredUnit: unit,
      }),
    [userBodyweightKg, unit]
  );

  const calculateTotalCompletedSets = useCallback(
    (exList: WorkoutExercise[]): number =>
      SetCalculator.calculateCompletedSetsCount(exList),
    []
  );

  const syncSessionToParent = (
    nextExercises: WorkoutExercise[],
    nextGroups: SupersetGroup[] = supersetGroups,
    nextBwKg: number = userBodyweightKg,
    nextUnit: WeightUnit = unit
  ) => {
    onUpdateSession({
      ...session,
      title: sessionTitle,
      durationSeconds,
      exercises: nextExercises,
      supersetGroups: nextGroups,
      userBodyweightKg: nextBwKg,
      preferredUnit: nextUnit,
      totalTonnageKg: calculateTonnage(nextExercises, nextBwKg),
      totalSets: calculateTotalCompletedSets(nextExercises),
    });
  };

  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    const updated = exercises.map((ex, i) =>
      i === exIdx
        ? {
            ...ex,
            sets: ex.sets.map((s, j) =>
              j === setIdx ? { ...s, completed: !s.completed } : s
            ),
          }
        : ex
    );
    const targetEx = updated[exIdx];
    const targetSet = targetEx.sets[setIdx];
    const willBeCompleted = targetSet.completed;

    setExercises(updated);

    if (willBeCompleted) {
      const activeGroup = supersetGroups.find(
        (g) => g.id === targetEx.supersetGroupId || g.exerciseIds.includes(targetEx.id)
      );
      if (activeGroup) {
        const restResolution = resolveSupersetRestOnSetToggle(
          activeGroup,
          updated,
          targetEx.id,
          setIdx
        );
        if (restResolution.shouldTriggerRest && restResolution.restDurationSeconds > 0) {
          setRestSecondsRemaining(restResolution.restDurationSeconds);
          setIsRestTimerActive(true);
        } else {
          setIsRestTimerActive(false);
          setRestSecondsRemaining(0);
        }
      } else {
        setRestSecondsRemaining(90);
        setIsRestTimerActive(true);
      }
    }

    syncSessionToParent(updated);
  };

  const handleUpdateWeight = useCallback(
    (exIdx: number, setIdx: number, baseWeightKgVal: number) => {
      const clampedWeightKg = Math.min(
        500,
        Math.max(0, isNaN(baseWeightKgVal) ? 0 : baseWeightKgVal)
      );
      const updated = exercises.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIdx
                  ? {
                      ...s,
                      weight: clampedWeightKg,
                      baseWeightKg: clampedWeightKg,
                      addedWeightKg: clampedWeightKg,
                      assistedWeightKg: clampedWeightKg,
                    }
                  : s
              ),
            }
          : ex
      );
      setExercises(updated);
      syncSessionToParent(updated);
    },
    [exercises, supersetGroups, userBodyweightKg, unit, sessionTitle, durationSeconds]
  );

  const handleChangeExerciseType = (exIdx: number, nextType: ExerciseType) => {
    const updated = exercises.map((ex, i) =>
      i === exIdx ? { ...ex, exerciseType: nextType } : ex
    );
    setExercises(updated);
    syncSessionToParent(updated);
  };

  const handleCreateSupersetGroup = (
    selectedExerciseIds: string[],
    intraRestSec: number,
    interRoundRestSec: number
  ) => {
    if (selectedExerciseIds.length < 2) return;
    const newGroup = createSupersetGroup({
      exerciseIds: selectedExerciseIds,
      intraRestSeconds: intraRestSec,
      interRoundRestSeconds: interRoundRestSec,
    });
    const nextGroups = [...supersetGroups, newGroup];
    const nextExercises = exercises.map((ex) =>
      selectedExerciseIds.includes(ex.id)
        ? { ...ex, supersetGroupId: newGroup.id }
        : ex
    );
    setSupersetGroups(nextGroups);
    setExercises(nextExercises);
    syncSessionToParent(nextExercises, nextGroups);
  };

  const handleUngroupSuperset = (groupId: string) => {
    const nextGroups = supersetGroups.filter((g) => g.id !== groupId);
    const nextExercises = exercises.map((ex) =>
      ex.supersetGroupId === groupId ? { ...ex, supersetGroupId: undefined } : ex
    );
    setSupersetGroups(nextGroups);
    setExercises(nextExercises);
    syncSessionToParent(nextExercises, nextGroups);
  };

  const handleUpdateGroupRest = (
    groupId: string,
    intraSec: number,
    interRoundSec: number
  ) => {
    const nextGroups = supersetGroups.map((g) =>
      g.id === groupId
        ? { ...g, intraRestSeconds: intraSec, interRoundRestSeconds: interRoundSec }
        : g
    );
    setSupersetGroups(nextGroups);
    syncSessionToParent(exercises, nextGroups);
  };

  const handleAddRoundToGroup = (groupId: string) => {
    const group = supersetGroups.find((g) => g.id === groupId);
    if (!group) return;
    const nextExercises = exercises.map((ex) => {
      if (!group.exerciseIds.includes(ex.id)) return ex;
      const prevSet = ex.sets[ex.sets.length - 1];
      const nextWeight = prevSet?.baseWeightKg ?? prevSet?.weight ?? 40;
      const newSet: ExerciseSet = {
        id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        setNumber: ex.sets.length + 1,
        setType: 'N',
        previous: prevSet ? `${UnitConverter.formatPlateWeight(nextWeight, unit)} × ${prevSet.reps}` : '-',
        weight: nextWeight,
        baseWeightKg: nextWeight,
        reps: prevSet?.reps || 10,
        rpe: 8.0,
        completed: false,
      };
      return { ...ex, sets: [...ex.sets, newSet] };
    });
    setExercises(nextExercises);
    syncSessionToParent(nextExercises);
  };

  const handleUpdateReps = useCallback(
    (exIdx: number, setIdx: number, repsVal: number) => {
      const clampedReps = Math.min(100, Math.max(0, isNaN(repsVal) ? 0 : repsVal));
      const updated = exercises.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIdx ? { ...s, reps: clampedReps } : s
              ),
            }
          : ex
      );
      setExercises(updated);
      syncSessionToParent(updated);
    },
    [exercises, supersetGroups, userBodyweightKg, unit, sessionTitle, durationSeconds]
  );

  const handleUpdateRpe = useCallback(
    (exIdx: number, setIdx: number, rpeVal: number) => {
      const clampedRpe = Math.min(10, Math.max(0, isNaN(rpeVal) ? 0 : rpeVal));
      const updated = exercises.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIdx ? { ...s, rpe: clampedRpe } : s
              ),
            }
          : ex
      );
      setExercises(updated);
      syncSessionToParent(updated);
    },
    [exercises, supersetGroups, userBodyweightKg, unit, sessionTitle, durationSeconds]
  );

  const handleAddSet = (exIdx: number) => {
    const targetEx = exercises[exIdx];
    const prevSet = targetEx.sets[targetEx.sets.length - 1];
    const newSet: ExerciseSet = {
      id: `set-${Date.now()}`,
      setNumber: targetEx.sets.length + 1,
      setType: 'N',
      previous: prevSet ? `${prevSet.weight}kg × ${prevSet.reps}` : '-',
      weight: prevSet?.weight || 60,
      reps: prevSet?.reps || 8,
      rpe: 8.0,
      completed: false,
    };
    const updated = exercises.map((ex, i) =>
      i === exIdx ? { ...ex, sets: [...ex.sets, newSet] } : ex
    );
    setExercises(updated);
    syncSessionToParent(updated);
  };

  const handleDeleteExercise = (exIdx: number) => {
    const updated = exercises.filter((_, idx) => idx !== exIdx);
    setExercises(updated);
    syncSessionToParent(updated);
  };

  const handleFinish = () => {
    const topPR = SetCalculator.findSessionTopPR({
      exercises,
      userBodyweightKg,
      preferredUnit: unit,
    });

    const finalizedSession: WorkoutSession = {
      ...session,
      title: sessionTitle,
      durationSeconds,
      exercises,
      supersetGroups,
      userBodyweightKg,
      preferredUnit: unit,
      totalTonnageKg: totalTonnage,
      totalSets: totalCompletedSets,
      prAchieved: {
        exerciseName: topPR.exerciseName,
        weight: topPR.weight,
        reps: topPR.reps,
        e1rm: topPR.e1rm,
      },
    };

    WorkoutDraftCacheService.syncCompoundPRsFromSession(finalizedSession);
    onFinishSession(finalizedSession);
  };

  return (
    <div className="flex flex-col min-h-full bg-zinc-950 text-zinc-100 w-full">
      {/* 1. Header (Cancel, Screen 3.2 "Đang Tập" + Live Title + Stopwatch, Finish CTA) */}
      <header className="sticky top-0 z-30 bg-zinc-950/85 backdrop-blur-xl border-b border-white/10 w-full">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-10 h-10 rounded-2xl text-zinc-400 hover:text-zinc-100 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all duration-200 flex items-center justify-center shrink-0 active:scale-[0.96]"
            title="Tùy chọn thoát"
            aria-label="Thoát buổi tập"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>

          <div className="flex-1 text-center min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20 animate-pulse" />
              <span>Đang Tập</span>
            </div>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className="w-full text-center bg-transparent font-display font-bold text-base sm:text-lg text-zinc-100 focus:outline-none border-b border-transparent focus:border-[#E4483C] truncate tracking-tight"
              placeholder="Tên buổi tập..."
            />
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#E4483C] font-display tabular-nums font-semibold">
              <Clock className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>{TelemetryParser.formatStopwatch(durationSeconds)}</span>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="apple-btn-primary min-h-[42px] px-5 py-2 text-xs sm:text-sm font-semibold shrink-0"
          >
            Hoàn thành
          </button>
        </div>
      </header>

      {/* 2. Scrollable Exercise Cards Body */}
      <div className="flex-1 px-4 sm:px-6 pt-6 pb-36 max-w-3xl mx-auto w-full flex flex-col gap-6">
        {/* Engine Controls: User Bodyweight, Lossless KG<->LBS Toggle, and Superset Builder */}
        <WorkoutEngineToolbar
          userBodyweightKg={userBodyweightKg}
          unit={unit}
          exercises={exercises}
          onChangeBodyweightKg={(nextBwKg) => {
            setUserBodyweightKg(nextBwKg);
            syncSessionToParent(exercises, supersetGroups, nextBwKg, unit);
          }}
          onChangeUnit={(nextUnit) => {
            setUnit(nextUnit);
            syncSessionToParent(exercises, supersetGroups, userBodyweightKg, nextUnit);
          }}
          onCreateSupersetGroup={handleCreateSupersetGroup}
        />

        {/* Scenario 2: Blank Slate - Empty Exercise List with Centered "➕ Thêm bài tập" Button */}
        {exercises.length === 0 ? (
          <section className="flex-1 min-h-[48dvh] rounded-3xl apple-card border border-dashed border-white/15 p-6 sm:p-10 flex flex-col items-center justify-center text-center gap-5 my-auto">
            <div className="apple-icon-badge-accent w-16 h-16 rounded-2xl">
              <Dumbbell className="w-8 h-8 stroke-[1.75]" />
            </div>

            <div className="flex flex-col gap-1.5 max-w-md">
              <h2 className="font-display font-bold text-lg text-zinc-100 tracking-tight">
                Buổi tập trống · Chưa có bài tập nào
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Nhấn vào nút bên dưới để chọn bài tập đầu tiên từ thư viện hơn 800 bài tập chuẩn quốc tế.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddExerciseModal(true)}
              className="apple-btn-accent min-h-[48px] px-8 py-3 text-sm font-bold shadow-lg"
            >
              <span>➕ Thêm bài tập</span>
            </button>
          </section>
        ) : (
          <>
            {(() => {
              const renderedGroupIds = new Set<string>();
              const EXERCISE_TYPES: ExerciseType[] = [
                'BARBELL_DUMBBELL_CABLE',
                'WEIGHTED_BODYWEIGHT',
                'ASSISTED_BODYWEIGHT',
                'BODYWEIGHT_ONLY',
              ];

              return exercises.map((exercise, exIdx) => {
                const matchingGroupIndex = supersetGroups.findIndex(
                  (g) =>
                    g.id === exercise.supersetGroupId ||
                    g.exerciseIds.includes(exercise.id)
                );

                if (matchingGroupIndex >= 0) {
                  const group = supersetGroups[matchingGroupIndex];
                  if (renderedGroupIds.has(group.id)) {
                    return null;
                  }
                  renderedGroupIds.add(group.id);
                  return (
                    <SupersetGroupCard
                      key={group.id}
                      group={group}
                      groupIndex={matchingGroupIndex}
                      allExercises={exercises}
                      userBodyweightKg={userBodyweightKg}
                      unit={unit}
                      onUngroup={handleUngroupSuperset}
                      onUpdateGroupRest={handleUpdateGroupRest}
                      onChangeExerciseType={handleChangeExerciseType}
                      onUpdateWeight={handleUpdateWeight}
                      onUpdateReps={handleUpdateReps}
                      onUpdateRpe={handleUpdateRpe}
                      onToggleComplete={handleToggleSetComplete}
                      onAddRoundToGroup={handleAddRoundToGroup}
                    />
                  );
                }

                const exType = classifyExerciseType(exercise);
                const validSets = exercise.sets.filter(
                  (s) =>
                    s.reps > 0 &&
                    resolveEffectiveWeightKg(exercise, s, {
                      bodyweightKg: userBodyweightKg,
                      preferredUnit: unit,
                    }) > 0
                );
                const bestE1rmSet = getSetsBestE1RM(validSets, exercise, {
                  bodyweightKg: userBodyweightKg,
                  preferredUnit: unit,
                });
                const exCompletedVolumeKg = exercise.sets
                  .filter((s) => s.completed)
                  .reduce(
                    (sum, s) =>
                      sum +
                      calculateSetVolume(exercise, s, {
                        bodyweightKg: userBodyweightKg,
                        preferredUnit: unit,
                      }),
                    0
                  );

                return (
                  <section
                    key={exercise.id}
                    className="apple-card p-5 sm:p-6 flex flex-col gap-4"
                  >
                    {/* Exercise Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/10">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-semibold text-base text-zinc-100 leading-snug truncate tracking-tight">
                            {exercise.name}
                          </h3>
                          <select
                            aria-label={`Phân loại cơ học ${exercise.name}`}
                            value={exType}
                            onChange={(e) =>
                              handleChangeExerciseType(exIdx, e.target.value as ExerciseType)
                            }
                            className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-zinc-200 focus:outline-none focus:border-[#E4483C]"
                          >
                            {EXERCISE_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {EXERCISE_TYPE_META[t].shortLabel}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-400">
                          <span>{exercise.vietnameseName}</span>
                          <span aria-hidden="true" className="text-zinc-600">·</span>
                          <span>{EXERCISE_TYPE_META[exType].formulaHint}</span>
                          {bestE1rmSet && bestE1rmSet.e1rm > 0 && (
                            <>
                              <span aria-hidden="true" className="text-zinc-600">·</span>
                              <span className="font-display tabular-nums text-[#E4483C] font-semibold flex items-center gap-1.5">
                                <Flame className="w-3.5 h-3.5 fill-[#E4483C]" />
                                <span>
                                  1RM ước tính:{' '}
                                  {UnitConverter.formatPlateWeight(bestE1rmSet.e1rm, unit, {
                                    step: 0.1,
                                  })}
                                </span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            const topSet = exercise.sets[0];
                            setPlateCalcWeight(topSet ? topSet.weight : 100);
                            setTargetSetForCalc({ exIdx, setIdx: 0 });
                          }}
                          className="apple-btn-secondary min-h-[40px] px-3.5 py-1.5 text-xs font-semibold gap-1.5"
                          title="Tính bánh tạ đòn"
                        >
                          <Disc className="w-3.5 h-3.5 text-[#E4483C] stroke-[1.75]" />
                          <span>Bánh tạ</span>
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(exIdx)}
                          className="w-10 h-10 rounded-2xl bg-white/[0.04] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 transition-all duration-200 flex items-center justify-center active:scale-[0.96]"
                          title="Xóa bài tập này"
                          aria-label={`Xóa bài tập ${exercise.name}`}
                        >
                          <Trash2 className="w-4 h-4 stroke-[1.75]" />
                        </button>
                      </div>
                    </div>

                    {/* Set Table Columns Header */}
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-zinc-400 px-2 text-center items-center">
                        <div className="col-span-1">Hiệp</div>
                        <div className="col-span-2 text-left pl-2 truncate">Trước</div>
                        <div className="col-span-2">
                          {EXERCISE_TYPE_META[exType].weightColumnHeader(unit)}
                        </div>
                        <div className="col-span-2">Lần</div>
                        <div className="col-span-2">RPE</div>
                        <div className="col-span-1" title="Ước tính 1RM">
                          1RM
                        </div>
                        <div className="col-span-2 text-right pr-2">Xong</div>
                      </div>

                      {/* Validated Set Rows */}
                      <div className="flex flex-col gap-2">
                        {exercise.sets.map((set, setIdx) => (
                          <ValidatedSetRow
                            key={set.id}
                            set={set}
                            exIdx={exIdx}
                            setIdx={setIdx}
                            bestE1rm={bestE1rmSet?.e1rm || 0}
                            exercise={exercise}
                            userBodyweightKg={userBodyweightKg}
                            unit={unit}
                            onUpdateWeight={handleUpdateWeight}
                            onUpdateReps={handleUpdateReps}
                            onUpdateRpe={handleUpdateRpe}
                            onToggleComplete={handleToggleSetComplete}
                          />
                        ))}
                      </div>

                      {/* Add Set CTA */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4">
                        <button
                          onClick={() => handleAddSet(exIdx)}
                          className="apple-btn-secondary min-h-[38px] px-3.5 py-1.5 text-xs font-semibold gap-1.5 text-[#E4483C]"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
                          <span>Thêm hiệp mới</span>
                        </button>

                        <div className="text-xs text-zinc-400 font-display tabular-nums">
                          Tổng tải:{' '}
                          <span className="font-semibold text-zinc-200">
                            {UnitConverter.formatPlateWeight(exCompletedVolumeKg, unit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              });
            })()}

            {/* Add Exercise CTA Button */}
            <button
              onClick={() => setShowAddExerciseModal(true)}
              className="w-full min-h-[48px] p-4 rounded-2xl apple-card-interactive text-zinc-200 font-semibold text-sm transition flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <Plus className="w-5 h-5 text-[#E4483C] stroke-[1.75]" />
              <span>➕ Thêm bài tập</span>
            </button>

            {/* End-of-Logger Compound Lifts E1RM Summary View */}
            <section
              aria-label="Tổng kết E1RM Compound"
              className="apple-card p-5 sm:p-6 flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="apple-icon-badge-accent">
                    <Trophy className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <h3 className="font-display font-bold text-base text-zinc-100 tracking-tight truncate">
                      Tổng kết 1RM ước tính (E1RM) · 3 Bài Compound
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Tự động tính từ hiệp nặng nhất buổi tập & đồng bộ sang Kỷ lục cá nhân
                    </p>
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${
                    syncedCompoundCount > 0
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/[0.04] text-zinc-400 border-white/10'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.75]" />
                  <span>
                    {syncedCompoundCount > 0
                      ? 'Đã đồng bộ Kỷ lục cá nhân'
                      : 'Chờ hiệp tập Compound'}
                  </span>
                </div>
              </div>

              {/* Top 3 Compound Lifts Grid: Bench Press, Back Squat, Deadlift */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topThreeCompoundLifts.map((lift) => {
                  const formattedE1rm =
                    lift.hasSessionSet && lift.e1rmKg > 0
                      ? UnitConverter.formatPlateWeight(lift.e1rmKg, unit, { step: 0.1 })
                      : `-- ${unit}`;
                  const formattedHeaviestWeight =
                    lift.hasSessionSet && lift.heaviestWeightKg > 0
                      ? UnitConverter.formatPlateWeight(lift.heaviestWeightKg, unit, { step: 0.5 })
                      : '';

                  return (
                    <div
                      key={lift.key}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between gap-3 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-xs font-medium text-zinc-400 truncate">
                            {lift.vietnameseName}
                          </span>
                          <h4 className="font-display font-bold text-sm text-zinc-100 truncate tracking-tight">
                            {lift.name}
                          </h4>
                        </div>
                        <span className="text-xl shrink-0">{lift.icon}</span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs text-zinc-400">E1RM</span>
                          <span
                            className="font-display tabular-nums text-lg font-bold tracking-tight"
                            style={{
                              color: lift.hasSessionSet ? '#F4F4F5' : '#71717A',
                            }}
                          >
                            {formattedE1rm}
                          </span>
                        </div>

                        <div
                          className="h-1 w-full rounded-full opacity-85"
                          style={{ backgroundColor: lift.color }}
                        />

                        {lift.hasSessionSet ? (
                          <div className="pt-1 flex flex-col gap-1">
                            <span className="text-xs text-zinc-400 font-display tabular-nums truncate">
                              Hiệp nặng nhất (H{lift.setNumber}):{' '}
                              <strong className="text-zinc-200">
                                {formattedHeaviestWeight} × {lift.reps}
                              </strong>
                              {lift.rpe ? ` @ RPE ${lift.rpe}` : ''}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Đã đồng bộ sang Kỷ lục cá nhân</span>
                            </span>
                          </div>
                        ) : (
                          <div className="pt-1 flex items-center justify-between gap-2">
                            <span className="text-xs text-zinc-500">
                              Chưa có trong buổi tập
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickAddCompoundLift(lift.key)}
                              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 text-xs font-semibold transition active:scale-[0.96] shrink-0"
                            >
                              + Thêm {lift.shortName}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer: Total SBD E1RM & Finish Sync CTA */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>Tổng E1RM 3 bài Compound (SBD):</span>
                  <strong className="font-display tabular-nums text-sm text-[#E4483C] font-bold">
                    {UnitConverter.formatPlateWeight(
                      topThreeCompoundLifts.reduce((acc, l) => acc + (l.e1rmKg || 0), 0),
                      unit,
                      { step: 0.1 }
                    )}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="apple-btn-accent min-h-[38px] px-4 py-1.5 text-xs font-semibold gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[1.75]" />
                  <span>Hoàn thành & Lưu kỷ lục</span>
                </button>
              </div>
            </section>
          </>
        )}
      </div>

      {/* 3. Sticky Bottom Container (Rest Timer Drawer + Live Heatmap Summary) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 w-full bg-zinc-950/85 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-2 px-4 sm:px-6 py-4">
          {isRestTimerActive && restSecondsRemaining > 0 && (
            <RestTimerDrawer
              secondsRemaining={restSecondsRemaining}
              onAdd30s={() => setRestSecondsRemaining((prev) => prev + 30)}
              onSkip={() => {
                setIsRestTimerActive(false);
                setRestSecondsRemaining(0);
              }}
            />
          )}

          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E4483C]" />
              <span className="text-zinc-400">Tổng tải:</span>
              <span className="font-display tabular-nums font-semibold text-[#E4483C]">
                {UnitConverter.formatPlateWeight(totalTonnage, unit)}
              </span>
              <span className="text-zinc-600" aria-hidden="true">·</span>
              <span className="font-display tabular-nums text-zinc-200">
                {totalCompletedSets} hiệp
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 truncate">
              {Object.entries(muscleSetsMap)
                .slice(0, 3)
                .map(([m, count], idx) => {
                  const tierColor = getColorHexForVolume(count || 0);
                  return (
                    <React.Fragment key={m}>
                      {idx > 0 && <span aria-hidden="true" className="text-zinc-700">·</span>}
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: tierColor }}
                        />
                        <span>
                          {m.replace('_', ' ')}:{' '}
                          <strong
                            className="font-display tabular-nums"
                            style={{ color: tierColor }}
                          >
                            {count}s
                          </strong>
                        </span>
                      </span>
                    </React.Fragment>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Plate Calculator Modal */}
      {plateCalcWeight !== null && (
        <PlateCalculatorModal
          initialWeight={plateCalcWeight}
          onClose={() => {
            setPlateCalcWeight(null);
            setTargetSetForCalc(null);
          }}
          onApply={(appliedWeight) => {
            if (targetSetForCalc) {
              handleUpdateWeight(targetSetForCalc.exIdx, targetSetForCalc.setIdx, appliedWeight);
            }
          }}
        />
      )}

      {/* Add Exercise Modal / Picker */}
      {showAddExerciseModal && (() => {
        const MUSCLE_FILTER_CHIPS = [
          'Tất cả',
          'Ngực',
          'Lưng',
          'Vai',
          'Tay',
          'Chân',
          'Bụng',
        ];

        const rawMatches = ALL_RAW_EXERCISES.filter((item) => {
          const primaryGroup = item.primaryMuscles?.[0]
            ? mapStringToMuscleGroup(item.primaryMuscles[0], item.name)
            : 'chest';

          if (!matchesMuscleCategoryFilter(primaryGroup, selectedMuscleCategory)) {
            return false;
          }

          if (exerciseSearch.trim()) {
            const q = exerciseSearch.toLowerCase().trim();
            const matchName = item.name.toLowerCase().includes(q);
            const matchVn = item.nameVn && item.nameVn.toLowerCase().includes(q);
            const matchEq = item.equipment && item.equipment.toLowerCase().includes(q);
            if (!matchName && !matchVn && !matchEq) return false;
          }

          return true;
        }).slice(0, 50);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <div className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="apple-icon-badge-accent">
                    <Dumbbell className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-base text-zinc-100 tracking-tight">Thư viện bài tập</h4>
                    <span className="text-xs text-zinc-400 font-display tabular-nums">
                      {ALL_RAW_EXERCISES.length} bài tập chuẩn quốc tế
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddExerciseModal(false);
                    setExerciseSearch('');
                  }}
                  className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition active:scale-[0.96]"
                  aria-label="Đóng thư viện bài tập"
                >
                  <X className="w-5 h-5 stroke-[1.75]" />
                </button>
              </div>

              {/* 1. Top Search Bar */}
              <div className="p-4 border-b border-white/10 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[1.75]" />
                  <input
                    type="text"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="Tìm theo tên tiếng Việt hoặc tiếng Anh (vd: Bench Press, Squat)..."
                    className="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-2xl pl-10 pr-10 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#E4483C] transition-colors"
                  />
                  {exerciseSearch && (
                    <button
                      onClick={() => setExerciseSearch('')}
                      className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100 flex items-center justify-center active:scale-[0.96]"
                      title="Xóa tìm kiếm"
                    >
                      <X className="w-3.5 h-3.5 stroke-[1.75]" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Body Part / Muscle Category Filter Chips */}
              <div className="px-4 py-2.5 border-b border-white/10 flex flex-nowrap items-center gap-2 overflow-x-auto scroll-touch shrink-0">
                {MUSCLE_FILTER_CHIPS.map((cat) => {
                  const isSelected = selectedMuscleCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedMuscleCategory(cat)}
                      className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'bg-white text-zinc-950 font-bold shadow-xs'
                          : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>

              {/* 3. Vertical List View of Exercise Cards */}
              <div className="p-4 overflow-y-auto flex flex-col gap-2.5 flex-1">
                {rawMatches.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-sm flex flex-col gap-2">
                    <p className="font-semibold text-zinc-100">Không tìm thấy bài tập phù hợp</p>
                    <p className="text-xs">Hãy thử tìm với từ khóa khác hoặc xóa bộ lọc nhóm cơ.</p>
                  </div>
                ) : (
                  rawMatches.map((item, idx) => {
                    const primaryGroup = item.primaryMuscles?.[0]
                      ? mapStringToMuscleGroup(item.primaryMuscles[0], item.name)
                      : 'chest';
                    const eq = item.equipment || 'bodyweight';

                    return (
                      <button
                        key={`${item.name}-${idx}`}
                        onClick={() => {
                          const resolved = resolveExerciseMusclesFromJson(item.name);
                          const primaryMuscle = resolved.primaryMuscles[0] || primaryGroup;
                          const secondaryMuscles = resolved.secondaryMuscles;

                          const newEx: WorkoutExercise = {
                            id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                            name: item.name,
                            vietnameseName: item.nameVn || item.name,
                            primaryMuscle,
                            secondaryMuscles,
                            sets: [
                              {
                                id: `set-${Date.now()}-1`,
                                setNumber: 1,
                                setType: 'N',
                                previous: '-',
                                weight: 40,
                                reps: 10,
                                rpe: 7.5,
                                completed: false,
                              },
                            ],
                          };
                          const updated = [...exercises, newEx];
                          setExercises(updated);
                          setShowAddExerciseModal(false);
                          setExerciseSearch('');
                          onUpdateSession({
                            ...session,
                            exercises: updated,
                            totalTonnageKg: calculateTonnage(updated),
                            totalSets: calculateTotalCompletedSets(updated),
                          });
                        }}
                        className="w-full text-left p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#E4483C]/50 transition-all duration-200 flex items-center justify-between gap-4 group active:scale-[0.99]"
                      >
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <h5 className="font-display font-semibold text-sm text-zinc-100 group-hover:text-[#E4483C] truncate tracking-tight">
                            {item.name}
                          </h5>
                          {item.nameVn && item.nameVn !== item.name && (
                            <span className="text-xs text-zinc-400 block truncate">
                              {item.nameVn}
                            </span>
                          )}
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span>{eq}</span>
                            <span aria-hidden="true" className="text-zinc-700">·</span>
                            <span className="text-[#E4483C]">
                              {getMuscleGroupLabel(primaryGroup, item.primaryMuscles?.[0])}
                            </span>
                          </div>
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] group-hover:bg-[#E4483C] flex items-center justify-center text-zinc-300 group-hover:text-white border border-white/10 transition shrink-0">
                          <Plus className="w-4 h-4 stroke-[1.75]" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 4. Cancel Session Options Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-sm bg-zinc-950/95 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display font-bold text-base text-zinc-100 tracking-tight">Thoát buổi tập?</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition active:scale-[0.96]"
                title="Đóng"
                aria-label="Đóng"
              >
                <X className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Bạn muốn tạm quay lại màn hình chính (tiến độ vẫn được lưu tự động) hay hủy bỏ hoàn toàn buổi tập này?
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  onCancelSession();
                }}
                className="apple-btn-secondary w-full min-h-[44px] py-2 px-4 text-xs font-semibold"
              >
                <span>Quay về màn hình chính</span>
              </button>

              <button
                onClick={() => {
                  setShowCancelModal(false);
                  if (onDiscardSession) {
                    onDiscardSession();
                  } else {
                    onCancelSession();
                  }
                }}
                className="w-full min-h-[44px] py-2 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Hủy bỏ buổi tập</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
