import React from 'react';
import { Layers, Clock, Plus, Unlink } from 'lucide-react';
import { WorkoutExercise } from '../../types/gym';
import {
  SupersetGroup,
  buildInterleavedExecutionSequence,
} from '../../engine/supersetExecutionEngine';
import {
  ExerciseType,
  EXERCISE_TYPE_META,
  classifyExerciseType,
  calculateSetVolume,
} from '../../engine/workoutExecutionEngine';
import { UnitConverter, WeightUnit } from '../../engine/unitConverter';
import { getSetsBestE1RM } from '../../utils/fitnessCalculations';
import { ValidatedSetRow } from './ValidatedSetRow';

interface SupersetGroupCardProps {
  group: SupersetGroup;
  groupIndex: number;
  allExercises: WorkoutExercise[];
  userBodyweightKg: number;
  unit: WeightUnit;
  onUngroup: (groupId: string) => void;
  onUpdateGroupRest: (groupId: string, intraSec: number, interRoundSec: number) => void;
  onChangeExerciseType: (exIdx: number, nextType: ExerciseType) => void;
  onUpdateWeight: (exIdx: number, setIdx: number, baseWeightKgVal: number) => void;
  onUpdateReps: (exIdx: number, setIdx: number, repsVal: number) => void;
  onUpdateRpe: (exIdx: number, setIdx: number, rpeVal: number) => void;
  onToggleComplete: (exIdx: number, setIdx: number) => void;
  onAddRoundToGroup: (groupId: string) => void;
}

const EXERCISE_TYPES: ExerciseType[] = [
  'BARBELL_DUMBBELL_CABLE',
  'WEIGHTED_BODYWEIGHT',
  'ASSISTED_BODYWEIGHT',
  'BODYWEIGHT_ONLY',
];

export const SupersetGroupCard: React.FC<SupersetGroupCardProps> = ({
  group,
  groupIndex,
  allExercises,
  userBodyweightKg,
  unit,
  onUngroup,
  onUpdateGroupRest,
  onChangeExerciseType,
  onUpdateWeight,
  onUpdateReps,
  onUpdateRpe,
  onToggleComplete,
  onAddRoundToGroup,
}) => {
  const prefixLetter = String.fromCharCode(65 + (groupIndex % 26));
  const { rounds, activeStep } = buildInterleavedExecutionSequence(
    group,
    allExercises,
    prefixLetter
  );

  const groupedExercises = group.exerciseIds
    .map((id) => {
      const exIdx = allExercises.findIndex((e) => e.id === id);
      return exIdx >= 0 ? { ex: allExercises[exIdx], exIdx } : null;
    })
    .filter((item): item is { ex: WorkoutExercise; exIdx: number } => item !== null);

  const bestE1rmByExId: Record<string, number> = {};
  groupedExercises.forEach(({ ex }) => {
    const best = getSetsBestE1RM(ex.sets, ex, {
      bodyweightKg: userBodyweightKg,
      preferredUnit: unit,
    });
    bestE1rmByExId[ex.id] = best?.e1rm || 0;
  });

  const groupTotalVolumeKg = groupedExercises.reduce((acc, { ex }) => {
    const exVol = ex.sets
      .filter((s) => s.completed)
      .reduce(
        (sum, s) =>
          sum +
          calculateSetVolume(ex, s, {
            bodyweightKg: userBodyweightKg,
            preferredUnit: unit,
          }),
        0
      );
    return acc + exVol;
  }, 0);

  return (
    <section className="apple-card p-5 sm:p-6 border border-[#E0B93D]/50 flex flex-col gap-5">
      {/* 1. Superset / Tri-set Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#E0B93D]/15 border border-[#E0B93D]/40 flex items-center justify-center text-[#E0B93D] shrink-0 backdrop-blur-md shadow-xs">
            <Layers className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-base sm:text-lg text-zinc-100 tracking-tight">
                {group.title ||
                  (group.groupType === 'TRISET' ? 'Tri-set 3 Bài' : 'Superset 2 Bài')}
              </h3>
              <span className="text-xs text-[#E0B93D] font-semibold">
                · Xen kẽ từng vòng (Interleaved)
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {activeStep
                ? `Đang tới lượt: [${activeStep.stationCode}] ${activeStep.exerciseName} · Vòng ${activeStep.roundNumber}`
                : 'Đã hoàn thành toàn bộ các vòng trong nhóm!'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onUngroup(group.id)}
          className="apple-btn-secondary min-h-[40px] px-3.5 py-1.5 text-xs font-semibold gap-1.5 shrink-0"
          title="Tách nhóm Superset/Tri-set về các bài đơn lẻ"
        >
          <Unlink className="w-4 h-4 stroke-[1.75]" />
          <span>Tách nhóm</span>
        </button>
      </div>

      {/* 2. Grouped Exercises Legend & Biomechanical Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {groupedExercises.map(({ ex, exIdx }, idx) => {
          const exType = classifyExerciseType(ex);
          return (
            <div
              key={ex.id}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded-lg bg-[#E0B93D]/20 border border-[#E0B93D]/30 text-[#E0B93D] font-display text-xs font-bold shrink-0">
                    {prefixLetter}
                    {idx + 1}
                  </span>
                  <span className="font-display text-sm font-semibold text-zinc-100 truncate tracking-tight">
                    {ex.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-400 truncate">{ex.vietnameseName}</span>
                <select
                  aria-label={`Phân loại tải ${ex.name}`}
                  value={exType}
                  onChange={(e) => onChangeExerciseType(exIdx, e.target.value as ExerciseType)}
                  className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#E0B93D]"
                >
                  {EXERCISE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {EXERCISE_TYPE_META[t].shortLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Intra-Superset vs Inter-Round Rest Timer Configuration */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <Clock className="w-4 h-4 text-[#E0B93D] stroke-[1.75]" />
          <span>Chuyển bài (Intra-rest):</span>
          <select
            aria-label="Thời gian nghỉ chuyển bài"
            value={group.intraRestSeconds}
            onChange={(e) =>
              onUpdateGroupRest(group.id, Number(e.target.value), group.interRoundRestSeconds)
            }
            className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 font-display font-semibold text-zinc-100"
          >
            <option value={0}>0s (Chuyển ngay)</option>
            <option value={15}>15s</option>
            <option value={20}>20s</option>
            <option value={30}>30s</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <span>Nghỉ hết vòng (Inter-round):</span>
          <select
            aria-label="Thời gian nghỉ hết vòng"
            value={group.interRoundRestSeconds}
            onChange={(e) =>
              onUpdateGroupRest(group.id, group.intraRestSeconds, Number(e.target.value))
            }
            className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 font-display font-semibold text-[#E0B93D]"
          >
            <option value={60}>60s</option>
            <option value={90}>90s</option>
            <option value={120}>120s</option>
            <option value={180}>180s</option>
          </select>
        </div>
      </div>

      {/* 4. Interleaved Execution Rounds ([ExA_Set1, ExB_Set1] -> Rest -> [ExA_Set2, ExB_Set2]) */}
      <div className="flex flex-col gap-4">
        {rounds.map((round) => (
          <div
            key={round.roundNumber}
            className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
              round.isRoundCompleted
                ? 'bg-emerald-500/[0.04] border-emerald-500/40'
                : 'bg-white/[0.02] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-zinc-100 tracking-tight">
                  Vòng {round.roundNumber}
                </span>
                <span className="text-xs text-zinc-400">
                  · Hoàn thành {round.completedCount}/{round.totalCount} bài
                </span>
              </div>
              <span className="text-xs font-display tabular-nums text-[#E0B93D]">
                Hết vòng nghỉ {round.interRoundRestSeconds}s
              </span>
            </div>

            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-zinc-400 px-2 text-center items-center">
              <div className="col-span-1">Trạm</div>
              <div className="col-span-2 text-left pl-1">Trước / Tải</div>
              <div className="col-span-2">{unit === 'lbs' ? 'Lbs' : 'Kg'}</div>
              <div className="col-span-2">Lần</div>
              <div className="col-span-2">RPE</div>
              <div className="col-span-1">1RM</div>
              <div className="col-span-2 text-right pr-2">Xong</div>
            </div>

            <div className="flex flex-col gap-2.5">
              {round.steps.map((step) => {
                const exObj = allExercises[step.exerciseIdxInSession];
                const isFocus =
                  activeStep?.exerciseId === step.exerciseId &&
                  activeStep?.setIdxInExercise === step.setIdxInExercise;

                return (
                  <ValidatedSetRow
                    key={step.set.id}
                    set={step.set}
                    exIdx={step.exerciseIdxInSession}
                    setIdx={step.setIdxInExercise}
                    bestE1rm={bestE1rmByExId[step.exerciseId] || 0}
                    exercise={exObj}
                    userBodyweightKg={userBodyweightKg}
                    unit={unit}
                    stationBadge={step.stationCode}
                    interleavedExerciseName={step.exerciseName}
                    isActiveFocusStep={isFocus}
                    onUpdateWeight={onUpdateWeight}
                    onUpdateReps={onUpdateReps}
                    onUpdateRpe={onUpdateRpe}
                    onToggleComplete={onToggleComplete}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 5. Add Round CTA & Group Volume */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onAddRoundToGroup(group.id)}
          className="apple-btn-secondary min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold gap-2 text-[#E0B93D]"
        >
          <Plus className="w-4 h-4 stroke-[1.75]" />
          <span>Thêm vòng mới cho cả nhóm</span>
        </button>

        <div className="text-xs text-zinc-400 font-display tabular-nums">
          Tổng tải nhóm:{' '}
          <span className="font-semibold text-zinc-100">
            {UnitConverter.formatPlateWeight(groupTotalVolumeKg, unit)}
          </span>
        </div>
      </div>
    </section>
  );
};
