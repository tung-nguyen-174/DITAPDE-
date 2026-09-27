import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Disc, 
  Plus, 
  Trash2, 
  Flame,
  Search,
  Dumbbell
} from 'lucide-react';
import { WorkoutSession, WorkoutExercise, ExerciseSet, MuscleGroup } from '../../types/gym';
import { PlateCalculatorModal } from '../common/PlateCalculatorModal';
import { RestTimerDrawer } from '../common/RestTimerDrawer';
import { ValidatedSetRow } from './ValidatedSetRow';
import { SupersetGroupCard } from './SupersetGroupCard';
import { WorkoutEngineToolbar } from './WorkoutEngineToolbar';
import { getSetsBestE1RM, PLATE_CODE_COLORS } from '../../utils/fitnessCalculations';
import {
  ExerciseType,
  EXERCISE_TYPE_META,
  classifyExerciseType,
  calculateSetVolume,
  calculateSetE1RM,
  resolveEffectiveWeightKg,
  DEFAULT_USER_BODYWEIGHT_KG,
} from '../../engine/workoutExecutionEngine';
import {
  SupersetGroup,
  createSupersetGroup,
  resolveSupersetRestOnSetToggle,
} from '../../engine/supersetExecutionEngine';
import { UnitConverter, WeightUnit } from '../../engine/unitConverter';
import { ALL_RAW_EXERCISES, mapStringToMuscleGroup } from '../../services/exerciseImporter';

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

  // Keep parent & Local Cache (Isar Draft) updated when stopwatch or title changes
  useEffect(() => {
    onUpdateSession({
      ...session,
      title: sessionTitle,
      durationSeconds,
      exercises,
      totalTonnageKg: calculateTonnage(exercises),
      totalSets: calculateTotalCompletedSets(exercises),
    });
  }, [durationSeconds, sessionTitle]);

  // Rest Timer Countdown
  useEffect(() => {
    let timer: any;
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
    return () => clearInterval(timer);
  }, [isRestTimerActive, restSecondsRemaining]);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateTonnage = (
    exList: WorkoutExercise[],
    bwKg: number = userBodyweightKg
  ): number => {
    return Number(
      exList
        .reduce((acc, ex) => {
          const exTonnage = ex.sets
            .filter((s) => s.completed)
            .reduce(
              (sum, s) =>
                sum + calculateSetVolume(ex, s, { bodyweightKg: bwKg, preferredUnit: unit }),
              0
            );
          return acc + exTonnage;
        }, 0)
        .toFixed(1)
    );
  };

  const calculateTotalCompletedSets = (exList: WorkoutExercise[]): number => {
    return exList.reduce((acc, ex) => {
      return acc + ex.sets.filter((s) => s.completed).length;
    }, 0);
  };

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

  const handleUpdateWeight = (exIdx: number, setIdx: number, baseWeightKgVal: number) => {
    const clampedWeightKg = Math.min(500, Math.max(0, isNaN(baseWeightKgVal) ? 0 : baseWeightKgVal));
    const updated = [...exercises];
    updated[exIdx].sets[setIdx] = {
      ...updated[exIdx].sets[setIdx],
      weight: clampedWeightKg,
      baseWeightKg: clampedWeightKg,
      addedWeightKg: clampedWeightKg,
      assistedWeightKg: clampedWeightKg,
    };
    setExercises(updated);
    syncSessionToParent(updated);
  };

  const handleChangeExerciseType = (exIdx: number, nextType: ExerciseType) => {
    const updated = [...exercises];
    updated[exIdx] = {
      ...updated[exIdx],
      exerciseType: nextType,
    };
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

  const handleUpdateReps = (exIdx: number, setIdx: number, repsVal: number) => {
    const clampedReps = Math.min(100, Math.max(0, isNaN(repsVal) ? 0 : repsVal));
    const updated = [...exercises];
    updated[exIdx].sets[setIdx].reps = clampedReps;
    setExercises(updated);
    onUpdateSession({
      ...session,
      title: sessionTitle,
      durationSeconds,
      exercises: updated,
      totalTonnageKg: calculateTonnage(updated),
      totalSets: calculateTotalCompletedSets(updated),
    });
  };

  const handleUpdateRpe = (exIdx: number, setIdx: number, rpeVal: number) => {
    const clampedRpe = Math.min(10, Math.max(0, isNaN(rpeVal) ? 0 : rpeVal));
    const updated = [...exercises];
    updated[exIdx].sets[setIdx].rpe = clampedRpe;
    setExercises(updated);
    onUpdateSession({
      ...session,
      title: sessionTitle,
      durationSeconds,
      exercises: updated,
      totalTonnageKg: calculateTonnage(updated),
      totalSets: calculateTotalCompletedSets(updated),
    });
  };

  const handleAddSet = (exIdx: number) => {
    const updated = [...exercises];
    const prevSet = updated[exIdx].sets[updated[exIdx].sets.length - 1];
    const newSet: ExerciseSet = {
      id: `set-${Date.now()}`,
      setNumber: updated[exIdx].sets.length + 1,
      setType: 'N',
      previous: prevSet ? `${prevSet.weight}kg × ${prevSet.reps}` : '-',
      weight: prevSet?.weight || 60,
      reps: prevSet?.reps || 8,
      rpe: 8.0,
      completed: false,
    };
    updated[exIdx].sets.push(newSet);
    setExercises(updated);
    onUpdateSession({
      ...session,
      title: sessionTitle,
      durationSeconds,
      exercises: updated,
      totalTonnageKg: calculateTonnage(updated),
      totalSets: calculateTotalCompletedSets(updated),
    });
  };

  const handleDeleteExercise = (exIdx: number) => {
    const updated = exercises.filter((_, idx) => idx !== exIdx);
    setExercises(updated);
    onUpdateSession({
      ...session,
      title: sessionTitle,
      durationSeconds,
      exercises: updated,
      totalTonnageKg: calculateTonnage(updated),
      totalSets: calculateTotalCompletedSets(updated),
    });
  };

  const handleFinish = () => {
    let bestE1RM = 0;
    let prCandidate: { exerciseName: string; weight: number; reps: number; e1rm: number } | undefined;

    exercises.forEach((ex) => {
      ex.sets
        .filter((s) => s.completed && s.reps > 0)
        .forEach((s) => {
          const effWeight = resolveEffectiveWeightKg(ex, s, {
            bodyweightKg: userBodyweightKg,
            preferredUnit: unit,
          });
          if (effWeight <= 0) return;
          const e1rm = calculateSetE1RM(ex, s, {
            bodyweightKg: userBodyweightKg,
            preferredUnit: unit,
          });
          if (e1rm > bestE1RM) {
            bestE1RM = e1rm;
            prCandidate = {
              exerciseName: ex.name,
              weight: effWeight,
              reps: s.reps,
              e1rm,
            };
          }
        });
    });

    const finalizedSession: WorkoutSession = {
      ...session,
      title: sessionTitle,
      durationSeconds,
      exercises,
      supersetGroups,
      userBodyweightKg,
      preferredUnit: unit,
      totalTonnageKg: calculateTonnage(exercises),
      totalSets: calculateTotalCompletedSets(exercises),
      prAchieved: prCandidate,
    };

    onFinishSession(finalizedSession);
  };

  const totalTonnage = calculateTonnage(exercises);
  const totalCompletedSets = calculateTotalCompletedSets(exercises);

  const muscleSetsMap: Partial<Record<MuscleGroup, number>> = {};
  exercises.forEach((ex) => {
    const done = ex.sets.filter((s) => s.completed).length;
    if (done > 0) {
      if (ex.primaryMuscle) {
        muscleSetsMap[ex.primaryMuscle] = (muscleSetsMap[ex.primaryMuscle] || 0) + done;
      }
      if (ex.secondaryMuscles) {
        ex.secondaryMuscles.forEach((sec) => {
          muscleSetsMap[sec] = (muscleSetsMap[sec] || 0) + done * 0.5;
        });
      }
    }
  });

  return (
    <div className="flex flex-col min-h-full bg-[#17161A] text-[#F2F1ED] w-full">
      {/* 1. Header (Cancel, Screen 3.2 "Đang Tập" + Live Title + Stopwatch, Finish CTA) */}
      <header className="sticky top-0 z-30 bg-[#1F1E24] border-b border-[#35343C] w-full">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <button
            onClick={() => setShowCancelModal(true)}
            className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] text-[#9C9AA3] hover:text-[#F2F1ED] hover:bg-[#28272E] transition flex items-center justify-center shrink-0"
            title="Tùy chọn thoát"
            aria-label="Thoát buổi tập"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center min-w-0 flex flex-col gap-1">
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-[#4CAF6D]">
              <span className="w-2 h-2 rounded-full bg-[#4CAF6D] animate-pulse" />
              <span>Đang Tập · Isar Local Cache</span>
            </div>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className="w-full text-center bg-transparent font-display font-bold text-[17px] sm:text-[18px] text-[#F2F1ED] focus:outline-hidden border-b border-transparent focus:border-[#E4483C] truncate"
              placeholder="Tên buổi tập..."
            />
            <div className="flex items-center justify-center gap-2 text-[13px] text-[#E4483C] font-display tabular-nums font-semibold">
              <Clock className="w-4 h-4" />
              <span>{formatTimer(durationSeconds)}</span>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-[14px] bg-[#E4483C] hover:bg-[#C23629] active:bg-[#C23629] text-[#F2F1ED] font-semibold text-[14px] transition shrink-0 flex items-center justify-center"
          >
            Hoàn thành
          </button>
        </div>
      </header>

      {/* 2. Scrollable Exercise Cards Body - 16px/24px screen margin (px-4 sm:px-6), 24px section gap */}
      <div className="flex-1 px-4 sm:px-6 pt-6 pb-36 max-w-3xl mx-auto w-full flex flex-col gap-6">
        {/* RPE Plate-Code Legend & Crash Recovery Simulation Bar */}
        <section className="bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] text-[#9C9AA3]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium text-[#F2F1ED]">Mã màu RPE:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATE_CODE_COLORS.green }} />
              <span>1–4 Nhẹ</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATE_CODE_COLORS.yellow }} />
              <span>5–6 Vừa</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATE_CODE_COLORS.blue }} />
              <span>7–8 Nặng</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATE_CODE_COLORS.red }} />
              <span>9–10 Tối đa</span>
            </span>
          </div>

          {onSimulateCrash && (
            <button
              type="button"
              onClick={() =>
                onSimulateCrash({
                  ...session,
                  title: sessionTitle,
                  durationSeconds,
                  exercises,
                  totalTonnageKg: calculateTonnage(exercises),
                  totalSets: calculateTotalCompletedSets(exercises),
                })
              }
              className="min-h-[40px] px-3 py-1.5 rounded-[12px] bg-[#28272E] hover:bg-[#35343C] border border-[#E0B93D]/40 text-[#E0B93D] font-semibold text-[12px] transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
              title="Giả lập ứng dụng bị đóng đột ngột để kiểm tra tính năng Phục hồi buổi tập (Crash Recovery)"
            >
              <span>⚡ Giả lập đóng đột ngột (Crash)</span>
            </button>
          )}
        </section>

        {/* Engine Controls: User Bodyweight, Lossless KG<->LBS Toggle, Superset Builder, and Test Suite */}
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
          <section className="flex-1 min-h-[48dvh] rounded-[24px] bg-[#1F1E24]/70 border border-dashed border-[#35343C] p-6 sm:p-10 flex flex-col items-center justify-center text-center gap-5 my-auto">
            <div className="w-16 h-16 rounded-[20px] bg-[#E4483C]/15 border border-[#E4483C]/40 flex items-center justify-center text-[#E4483C]">
              <Dumbbell className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-2 max-w-md">
              <h2 className="font-display font-bold text-[20px] text-[#F2F1ED]">
                Buổi tập trống · Chưa có bài tập nào
              </h2>
              <p className="text-[14px] text-[#9C9AA3] leading-relaxed">
                Nhấn vào nút bên dưới để chọn bài tập đầu tiên từ thư viện hơn 800 bài tập chuẩn quốc tế.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddExerciseModal(true)}
              className="min-h-[56px] px-8 py-4 rounded-[18px] bg-[#E4483C] hover:bg-[#C23629] active:bg-[#C23629] text-[#F2F1ED] font-display font-bold text-[16px] shadow-xl shadow-[#E4483C]/20 transition flex items-center justify-center gap-2.5 active:scale-95"
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
                    className="bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-4 sm:p-6 flex flex-col gap-4"
                  >
                    {/* Exercise Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#35343C]">
                      <div className="flex flex-col gap-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-semibold text-[16px] text-[#F2F1ED] leading-snug truncate">
                            {exercise.name}
                          </h3>
                          <select
                            aria-label={`Phân loại cơ học ${exercise.name}`}
                            value={exType}
                            onChange={(e) =>
                              handleChangeExerciseType(exIdx, e.target.value as ExerciseType)
                            }
                            className="bg-[#28272E] border border-[#35343C] rounded-[10px] px-2.5 py-1 text-[11px] font-medium text-[#F2F1ED] focus:outline-hidden focus:border-[#E4483C]"
                          >
                            {EXERCISE_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {EXERCISE_TYPE_META[t].shortLabel}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center flex-wrap gap-2 text-[12px] text-[#9C9AA3]">
                          <span>{exercise.vietnameseName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{EXERCISE_TYPE_META[exType].formulaHint}</span>
                          {bestE1rmSet && bestE1rmSet.e1rm > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
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
                          className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-[14px] bg-[#28272E] hover:bg-[#35343C] text-[#F2F1ED] text-[13px] font-medium border border-[#35343C] transition flex items-center gap-2"
                          title="Tính bánh tạ đòn"
                        >
                          <Disc className="w-4 h-4 text-[#E4483C]" />
                          <span>Bánh tạ</span>
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(exIdx)}
                          className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] bg-[#28272E] hover:bg-[#E4483C]/20 text-[#9C9AA3] hover:text-[#E4483C] border border-[#35343C] transition flex items-center justify-center"
                          title="Xóa bài tập này"
                          aria-label={`Xóa bài tập ${exercise.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Set Table Columns Header */}
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-12 gap-2 text-[12px] font-medium text-[#9C9AA3] px-2 text-center items-center">
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
                      <div className="pt-4 border-t border-[#35343C] flex items-center justify-between gap-4">
                        <button
                          onClick={() => handleAddSet(exIdx)}
                          className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-[14px] bg-[#28272E] hover:bg-[#35343C] text-[#E4483C] text-[14px] font-semibold border border-[#35343C] transition flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Thêm hiệp mới</span>
                        </button>

                        <div className="text-[13px] text-[#9C9AA3] font-display tabular-nums">
                          Tổng tải:{' '}
                          <span className="font-semibold text-[#F2F1ED]">
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
              className="w-full min-h-[48px] p-4 rounded-[20px] bg-[#1F1E24] hover:bg-[#28272E] border border-[#35343C] text-[#F2F1ED] font-semibold text-[15px] transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5 text-[#E4483C]" />
              <span>➕ Thêm bài tập</span>
            </button>
          </>
        )}
      </div>

      {/* 3. Sticky Bottom Container (Rest Timer Drawer + Live Heatmap Summary) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 w-full bg-[#1F1E24] border-t border-[#35343C]">
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

          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="w-3 h-3 rounded-[14px] bg-[#E4483C]" />
              <span className="text-[#9C9AA3]">Tổng tải:</span>
              <span className="font-display tabular-nums font-semibold text-[#E4483C]">
                {UnitConverter.formatPlateWeight(totalTonnage, unit)}
              </span>
              <span className="text-[#656470]" aria-hidden="true">·</span>
              <span className="font-display tabular-nums text-[#F2F1ED]">
                {totalCompletedSets} hiệp
              </span>
            </div>

            <div className="flex items-center gap-2 text-[12px] text-[#9C9AA3] truncate">
              {Object.entries(muscleSetsMap)
                .slice(0, 2)
                .map(([m, count], idx) => (
                  <React.Fragment key={m}>
                    {idx > 0 && <span aria-hidden="true">·</span>}
                    <span>
                      {m.replace('_', ' ')}: <strong className="text-[#F2F1ED] font-display tabular-nums">{count}s</strong>
                    </span>
                  </React.Fragment>
                ))}
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
            ? mapStringToMuscleGroup(item.primaryMuscles[0])
            : 'chest';

          if (selectedMuscleCategory !== 'Tất cả') {
            if (selectedMuscleCategory === 'Ngực' && primaryGroup !== 'chest') return false;
            if (
              selectedMuscleCategory === 'Lưng' &&
              !['lats', 'upper_back', 'lower_back'].includes(primaryGroup)
            )
              return false;
            if (
              selectedMuscleCategory === 'Vai' &&
              !['front_delts', 'side_delts', 'rear_delts'].includes(primaryGroup)
            )
              return false;
            if (
              selectedMuscleCategory === 'Tay' &&
              !['biceps', 'triceps'].includes(primaryGroup)
            )
              return false;
            if (
              selectedMuscleCategory === 'Chân' &&
              !['quads', 'glutes', 'calves', 'hamstrings'].includes(primaryGroup)
            )
              return false;
            if (selectedMuscleCategory === 'Bụng' && primaryGroup !== 'abs') return false;
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xs">
            <div className="bg-[#1F1E24] border border-[#35343C] rounded-[20px] w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-[#35343C] flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Dumbbell className="w-5 h-5 text-[#E4483C]" />
                  <div>
                    <h4 className="font-display font-bold text-[18px] text-[#F2F1ED]">Thư viện bài tập</h4>
                    <span className="text-[12px] text-[#9C9AA3] font-display tabular-nums">
                      {ALL_RAW_EXERCISES.length} bài tập chuẩn quốc tế
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddExerciseModal(false);
                    setExerciseSearch('');
                  }}
                  className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] text-[#9C9AA3] hover:text-[#F2F1ED] hover:bg-[#28272E] flex items-center justify-center transition"
                  aria-label="Đóng thư viện bài tập"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Top Search Bar */}
              <div className="p-4 border-b border-[#35343C]">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#9C9AA3] absolute left-4 top-4" />
                  <input
                    type="text"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="Tìm theo tên tiếng Việt hoặc tiếng Anh (vd: Bench Press, Squat)..."
                    className="w-full min-h-[48px] bg-[#28272E] border border-[#35343C] rounded-[14px] pl-10 pr-10 py-2 text-[14px] text-[#F2F1ED] placeholder-[#656470] focus:outline-hidden focus:border-[#E4483C]"
                  />
                  {exerciseSearch && (
                    <button
                      onClick={() => setExerciseSearch('')}
                      className="absolute right-2 top-0 min-w-[48px] min-h-[48px] flex items-center justify-center text-[#9C9AA3] hover:text-[#F2F1ED]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Horizontal Category Filter Chips (8px gap, 48px touch target) */}
              <div className="px-4 py-2 border-b border-[#35343C] flex items-center gap-2 overflow-x-auto no-scrollbar">
                {MUSCLE_FILTER_CHIPS.map((cat) => {
                  const isSelected = selectedMuscleCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedMuscleCategory(cat)}
                      className={`min-h-[48px] min-w-[48px] px-4 py-2 rounded-[14px] text-[13px] font-medium whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-[#E4483C] text-[#F2F1ED]'
                          : 'bg-[#28272E] text-[#9C9AA3] hover:text-[#F2F1ED] border border-[#35343C]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* 3. Vertical List View of Exercise Cards (16px gap) */}
              <div className="p-4 overflow-y-auto flex flex-col gap-4 flex-1">
                {rawMatches.length === 0 ? (
                  <div className="py-12 text-center text-[#9C9AA3] text-[14px] flex flex-col gap-2">
                    <p className="font-semibold text-[#F2F1ED]">Không tìm thấy bài tập phù hợp</p>
                    <p className="text-[12px]">Hãy thử tìm với từ khóa khác hoặc xóa bộ lọc nhóm cơ.</p>
                  </div>
                ) : (
                  rawMatches.map((item, idx) => {
                    const primaryGroup = item.primaryMuscles?.[0]
                      ? mapStringToMuscleGroup(item.primaryMuscles[0])
                      : 'chest';
                    const eq = item.equipment || 'bodyweight';

                    return (
                      <button
                        key={`${item.name}-${idx}`}
                        onClick={() => {
                          const primaryMuscle = item.primaryMuscles?.[0]
                            ? mapStringToMuscleGroup(item.primaryMuscles[0])
                            : 'chest';
                          const secondaryMuscles = (item.secondaryMuscles || []).map(mapStringToMuscleGroup);

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
                        className="w-full text-left p-4 rounded-[20px] bg-[#28272E] hover:bg-[#35343C] border border-[#35343C] hover:border-[#E4483C] transition flex items-center justify-between gap-4 group"
                      >
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                          <h5 className="font-display font-semibold text-[16px] text-[#F2F1ED] group-hover:text-[#E4483C] truncate">
                            {item.name}
                          </h5>
                          {item.nameVn && item.nameVn !== item.name && (
                            <span className="text-[13px] text-[#9C9AA3] block truncate">
                              {item.nameVn}
                            </span>
                          )}
                          <div className="flex items-center gap-2 text-[12px] text-[#9C9AA3]">
                            <span>{eq}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#E4483C]">{primaryGroup}</span>
                          </div>
                        </div>

                        <div className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] bg-[#1F1E24] flex items-center justify-center text-[#9C9AA3] group-hover:text-[#E4483C] border border-[#35343C] transition shrink-0">
                          <Plus className="w-5 h-5" />
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-sm bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display font-bold text-[18px] text-[#F2F1ED]">Thoát buổi tập?</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] text-[#9C9AA3] hover:text-[#F2F1ED] hover:bg-[#28272E] flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[14px] text-[#9C9AA3] leading-relaxed">
              Bạn muốn tạm quay lại màn hình chính (tiến độ vẫn được lưu tự động) hay hủy bỏ hoàn toàn buổi tập này?
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  onCancelSession();
                }}
                className="w-full min-h-[48px] py-2 px-4 rounded-[14px] bg-[#28272E] hover:bg-[#35343C] text-[#F2F1ED] font-semibold text-[14px] flex items-center justify-center gap-2 border border-[#35343C] transition"
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
                className="w-full min-h-[48px] py-2 px-4 rounded-[14px] bg-[#E4483C]/15 hover:bg-[#E4483C]/25 text-[#E4483C] font-semibold text-[14px] flex items-center justify-center gap-2 border border-[#E4483C] transition"
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
